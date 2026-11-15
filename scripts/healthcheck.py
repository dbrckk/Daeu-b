#!/usr/bin/env python3
"""Healthcheck public et gratuit du site statique DAEU B.

N'utilise aucun compte, token ni service externe autre que l'hôte publié.
Vérifie les ressources essentielles, CSP, manifeste et liens SEO.
"""
import argparse
from base64 import b64encode
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
import re
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse
from pathlib import Path

ORIGIN = "https://daeu-b-maths-dbrckk.onrender.com"
FILES = (
    ("/", "text/html", b'id="firstStart"'),
    ("/app.mjs", "javascript", b"function firstStart()"),
    ("/cloud-sync.mjs", "javascript", b"xxypyvzkciowwseldxhq"),
    ("/sw.js", "javascript", b"daeu-b-maths-"),
    ("/elementary-derivative.mjs", "javascript", b"parseElementaryFunction"),
    ("/manifest.json", "json", b"DAEU"),
    ("/robots.txt", "text/plain", b"Sitemap:"),
    ("/sitemap.xml", "xml", ORIGIN.encode()),
)


def fetch(path, *, attempts=1):
    url = ORIGIN + path
    last_error = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "DAEU-B-healthcheck/1.0", "Accept": "*/*"},
            )
            with urllib.request.urlopen(request, timeout=12) as response:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status} pour {path}")
                final = urlparse(response.geturl())
                if final.scheme != "https" or final.netloc != urlparse(ORIGIN).netloc:
                    raise RuntimeError(f"Redirection inattendue vers {response.geturl()}")
                content_type = response.headers.get("Content-Type", "")
                body = response.read(1_048_577)
                if len(body) >= 1_048_577:
                    raise RuntimeError(f"Fichier trop volumineux : {path}")
                return content_type.lower(), body
        except (urllib.error.URLError, TimeoutError, OSError, RuntimeError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(3)
    raise RuntimeError(f"Site inaccessible : {path} ({last_error})")


INTEGRITY_PATTERN = re.compile(rb"^const INTEGRITY=(\{[\s\S]*?\});$", re.M)
ASSETS_PATTERN = re.compile(rb"^const ASSETS=(\[[^\n]+\]);$", re.M)
CACHE_PATTERN = re.compile(rb'const CACHE\s*=\s*"(daeu-b-maths-v[0-9]+)"\s*;')
REQUIRED_OFFLINE = (
    b'"./start.mjs"',
    b'"./auto-backup.mjs"',
    b'"./cloud-sync.mjs"',
    b'"./elementary-derivative.mjs"',
    b'"./course.html"',
    b'"./problems.html"',
)


def validate_service_worker(deployed, expected):
    """Détecte une publication partielle ou obsolète sans numéro codé en dur."""
    live = CACHE_PATTERN.search(deployed)
    source = CACHE_PATTERN.search(expected)
    if not live or not source:
        raise RuntimeError("Version du cache PWA manquante ou invalide")
    if live.group(1) != source.group(1):
        raise RuntimeError(
            "Cache PWA publié différent du dépôt : "
            f"public={live.group(1).decode()}, source={source.group(1).decode()}"
        )
    for asset in REQUIRED_OFFLINE:
        if asset not in deployed:
            raise RuntimeError(f"Ressource essentielle absente du cache : {asset.decode()}")
    if deployed != expected:
        raise RuntimeError("Script du service worker publié différent du dépôt")
    return live.group(1).decode()


def read_integrity(worker):
    manifest_match = INTEGRITY_PATTERN.search(worker)
    assets_match = ASSETS_PATTERN.search(worker)
    if not manifest_match or not assets_match:
        raise RuntimeError("Liste ou empreintes des ressources PWA absentes")
    manifest = json.loads(manifest_match[1])
    assets = json.loads(assets_match[1])
    if not isinstance(manifest, dict) or not assets or set(manifest) != set(assets):
        raise RuntimeError("Les empreintes PWA ne couvrent pas les ressources attendues")
    for asset, digest in manifest.items():
        if not re.fullmatch(r"\./(?:[a-zA-Z0-9_.-]+/)*[a-zA-Z0-9_.-]*", asset) or ".." in asset.split("/"):
            raise RuntimeError(f"Chemin PWA invalide : {asset}")
        if not isinstance(digest, str) or not re.fullmatch(r"sha256-[a-zA-Z0-9+/]{43}=", digest):
            raise RuntimeError(f"Empreinte PWA invalide : {asset}")
    return {asset[1:]: digest for asset, digest in manifest.items()}


def verify_asset(path, digest):
    try:
        response = fetch(path)
    except RuntimeError as error:
        return None, str(error)
    actual = "sha256-" + b64encode(sha256(response[1]).digest()).decode("ascii")
    if actual != digest:
        return None, "empreinte différente du dépôt"
    return response, None


def verify_publication(expected_worker, wait_seconds):
    expected_assets = read_integrity(expected_worker)
    pending = dict(expected_assets)
    responses = {}
    version = None
    deadline = time.monotonic() + wait_seconds
    while True:
        failures = {}
        try:
            worker = fetch("/sw.js")
            version = validate_service_worker(worker[1], expected_worker)
        except RuntimeError as error:
            failures["/sw.js"] = str(error)
        if not failures:
            with ThreadPoolExecutor(max_workers=12) as pool:
                checks = pool.map(verify_asset, pending, pending.values())
                for path, (response, error) in zip(pending, checks):
                    if error:
                        failures[path] = error
                    else:
                        responses[path] = response
            pending = {path: expected_assets[path] for path in failures}
            print(f"{len(responses)}/{len(expected_assets)} ressources publiques conformes", flush=True)
            if not pending:
                responses["/sw.js"] = worker
                return version, responses
        else:
            print(f"En attente du service worker publié ({failures['/sw.js']})", flush=True)

        remaining = deadline - time.monotonic()
        if remaining <= 0:
            report = "\n".join(f"- {path} : {error}" for path, error in failures.items())
            raise RuntimeError(f"Publication incomplète\n{report}")
        time.sleep(min(15, remaining))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wait-seconds", type=int, default=0)
    args = parser.parse_args()
    source_sw = (Path(__file__).resolve().parent.parent / "app" / "sw.js").read_bytes()
    version, responses = verify_publication(source_sw, args.wait_seconds)
    payloads = {}
    for path, content_type_hint, expected in FILES:
        content_type, payload = responses[path] if path in responses else fetch(path, attempts=3)
        if content_type_hint not in content_type and not (
            content_type_hint == "javascript" and
            "application/octet-stream" in content_type
        ):
            raise RuntimeError(
                f"Type inattendu pour {path} : {content_type}"
            )
        if expected not in payload:
            raise RuntimeError(f"Contenu attendu absent : {path}")
        payloads[path] = payload
        print(f"OK {path}: {len(payload):,} octets ({content_type})")

    print(f"Cache PWA vérifié : {version}")

    home = payloads["/"].decode("utf-8")
    if f'rel="canonical" href="{ORIGIN}/"' not in home:
        raise RuntimeError("Le site ne publie pas l'URL canonique permanente")
    if "Content-Security-Policy" not in home or "script-src 'self'" not in home:
        raise RuntimeError("Protection CSP absente du HTML public")
    manifest = json.loads(payloads["/manifest.json"])
    if manifest.get("start_url") != "./index.html" or manifest.get("display") != "standalone":
        raise RuntimeError("Manifeste PWA incompatible")
    if (ORIGIN + "/sitemap.xml").encode() not in payloads["/robots.txt"]:
        raise RuntimeError("Sitemap non référencé")
    print(f"Site public vérifié : {ORIGIN}/")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        raise SystemExit(str(error)) from error
