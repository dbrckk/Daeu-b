"""Régression de la surveillance publique et des ressources hors-ligne."""
import unittest
from healthcheck import validate_service_worker

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

if __name__ == "__main__":
    unittest.main()
