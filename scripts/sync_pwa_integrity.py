#!/usr/bin/env python3
"""Actualise ou vérifie les empreintes des ressources hors connexion."""
import argparse
from base64 import b64encode
from hashlib import sha256
import json
from pathlib import Path
import re

APP = Path(__file__).resolve().parents[1] / "app"
WORKER = APP / "sw.js"


def refresh(worker):
    assets = json.loads(re.search(r"^const ASSETS=(\[[^\n]+\]);$", worker, re.M)[1])
    digests = {}
    for asset in assets:
        path = "index.html" if asset == "./" else asset[2:]
        digest = b64encode(sha256((APP / path).read_bytes()).digest()).decode("ascii")
        digests[asset] = "sha256-" + digest
    manifest = "const INTEGRITY=" + json.dumps(digests, indent=2) + ";"
    return re.sub(r"^const INTEGRITY=\{.*?\};", lambda _: manifest, worker, flags=re.M | re.S)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    worker = WORKER.read_text(encoding="utf-8")
    if "const INTEGRITY=" not in worker:
        parser.exit(1, "Bloc d’empreintes PWA absent.\n")
    updated = refresh(worker)
    if args.check:
        if updated != worker:
            parser.exit(1, "Empreintes PWA obsolètes. Exécuter python3 scripts/sync_pwa_integrity.py.\n")
        print("OK : empreintes SHA-256 du cache PWA.")
    else:
        WORKER.write_text(updated, encoding="utf-8")
