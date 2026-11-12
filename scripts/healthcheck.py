#!/usr/bin/env python3
"""Healthcheck public et gratuit du site statique DAEU B.

N'utilise aucun compte, token ni service externe autre que l'hôte publié.
Vérifie les ressources essentielles, CSP, manifeste et liens SEO.
"""
import json
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

ORIGIN = "https://daeu-b-maths-dbrckk.onrender.com"
FILES = (
    ("/", "text/html", b'id="firstStart"'),
    ("/app.mjs", "javascript", b"function firstStart()"),
    ("/cloud-sync.mjs", "javascript", b"xxypyvzkciowwseldxhq"),
    ("/sw.js", "javascript", b"daeu-b-maths-v29-1"),
    ("/manifest.json", "json", b"DAEU"),
    ("/robots.txt", "text/plain", b"Sitemap:"),
    ("/sitemap.xml", "xml", ORIGIN.encode()),
)


def fetch(path):
    url = ORIGIN + path
    last_error = None
    for attempt in range(3):
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
                body = response.read(150_001)
                if len(body) >= 150_001:
                    raise RuntimeError(f"Fichier trop volumineux : {path}")
                return content_type.lower(), body
        except (urllib.error.URLError, TimeoutError, OSError, RuntimeError) as error:
            last_error = error
            if attempt < 2:
                time.sleep(3)
    raise RuntimeError(f"Site inaccessible : {path} ({last_error})")


def main():
    payloads = {}
    for path, content_type_hint, expected in FILES:
        content_type, payload = fetch(path)
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
    main()
