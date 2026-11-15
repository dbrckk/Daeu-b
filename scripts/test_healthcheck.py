"""Régression de la surveillance publique et des ressources hors-ligne."""
from base64 import b64encode
from hashlib import sha256
from pathlib import Path
import unittest
from unittest.mock import patch

from healthcheck import read_integrity, validate_service_worker, verify_asset, verify_publication

class ServiceWorkerHealthTests(unittest.TestCase):
    def setUp(self):
        self.cache = b'const CACHE="daeu-b-maths-v34";'
        self.assets = (
            b'"./start.mjs","./auto-backup.mjs","./cloud-sync.mjs",'
            b'"./elementary-derivative.mjs","./course.html","./problems.html"'
        )
        self.actual = self.cache + self.assets

    def test_current_deployment(self):
        self.assertEqual(validate_service_worker(self.actual, self.actual), "daeu-b-maths-v34")

    def test_future_version_does_not_require_manual_change(self):
        updated = self.actual.replace(b"v34", b"v35")
        self.assertEqual(validate_service_worker(updated, updated), "daeu-b-maths-v35")

    def test_stale_deployment_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "différent"):
            validate_service_worker(self.actual.replace(b"v34", b"v33"), self.actual)

    def test_missing_essential_asset_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "Ressource essentielle"):
            validate_service_worker(self.actual.replace(b'"./cloud-sync.mjs",', b""), self.actual)

    def test_malformed_cache_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "Version"):
            validate_service_worker(self.actual.replace(b'const CACHE=', b'CACHE='), self.actual)

class PublicReleaseTests(unittest.TestCase):
    worker = (Path(__file__).resolve().parents[1] / "app" / "sw.js").read_bytes()
    assets = read_integrity(worker)

    def test_manifest_covers_root_and_launch_page(self):
        self.assertEqual(self.assets["/"], self.assets["/index.html"])
        self.assertIn("/equation-ink.mjs", self.assets)

    def test_mixed_or_incomplete_publication_reports_paths(self):
        def wrong_asset(path, digest):
            if path == "/equation-ink.mjs":
                return None, "empreinte différente du dépôt"
            if path == "/course.html":
                return None, "HTTP 404"
            return ("text/plain", b"conforme"), None

        with patch("healthcheck.fetch", return_value=("javascript", self.worker)), \
             patch("healthcheck.verify_asset", side_effect=wrong_asset):
            with self.assertRaisesRegex(RuntimeError, r"(?s)Publication incomplète.*(/course.html.*HTTP 404.*equation-ink.mjs|/equation-ink.mjs.*empreinte différente.*/course.html)"):
                verify_publication(self.worker, 0)

    def test_retry_only_checks_remaining_files(self):
        attempts = []

        def changing_asset(path, digest):
            delayed = path == "/equation-ink.mjs" and path not in attempts
            attempts.append(path)
            return (None, "empreinte différente") if delayed else (("text/plain", b"conforme"), None)

        with patch("healthcheck.fetch", return_value=("javascript", self.worker)), \
             patch("healthcheck.verify_asset", side_effect=changing_asset), patch("healthcheck.time.sleep"):
            _, responses = verify_publication(self.worker, 60)
        self.assertEqual(set(responses), {*self.assets, "/sw.js"})
        self.assertEqual(attempts.count("/equation-ink.mjs"), 2)
        self.assertEqual(attempts.count("/course.html"), 1)

    def test_successful_http_response_with_stale_content_fails(self):
        digest = "sha256-" + b64encode(sha256(b"nouveau").digest()).decode("ascii")
        with patch("healthcheck.fetch", return_value=("javascript", b"ancien")):
            self.assertEqual(verify_asset("/equation-ink.mjs", digest), (None, "empreinte différente du dépôt"))


if __name__ == "__main__":
    unittest.main()
