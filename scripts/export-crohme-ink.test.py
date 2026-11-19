"""Régressions de l'export CROHME, sans corpus externe ni téléchargement."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

SCRIPT = Path(__file__).with_name("export-crohme-ink.py")
spec = importlib.util.spec_from_file_location("crohme_export", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

INKML = """<?xml version="1.0" encoding="utf-8"?>
<ink xmlns="http://www.w3.org/2003/InkML">
  <trace id="0">0 0, 5 10</trace>
  <trace id="1">5 10, 10 20</trace>
  <traceGroup>
    <traceGroup>
      <annotation type="truth">{label}</annotation>
      <traceView traceDataRef="0"/>
      <traceView traceDataRef="1"/>
    </traceGroup>
  </traceGroup>
</ink>"""


class ExportSymbolsTest(unittest.TestCase):
    def test_all_digits_and_controls_are_exported(self):
        with tempfile.TemporaryDirectory() as temp:
            archive = Path(temp) / "crohme.zip"
            with ZipFile(archive, "w") as zip_file:
                for symbol in "0123456789+x":
                    zip_file.writestr(
                        f"TestEM2014GT_INKMLs/case_{ord(symbol)}.inkml",
                        INKML.format(label=symbol),
                    )
            samples = module.load_cases(archive, "TestEM2014GT_INKMLs", symbols=True)
            self.assertEqual({row["expected"] for row in samples}, set("0123456789+x"))
            self.assertEqual(len(samples), 12)
            self.assertTrue(all(len(row["paths"]) == 2 for row in samples))
            self.assertTrue(all(row["group"] == "crohme-symbol" for row in samples))

    def test_wrong_split_and_non_digit_symbol_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            archive = Path(temp) / "crohme.zip"
            with ZipFile(archive, "w") as zip_file:
                zip_file.writestr("TestEM2014GT_INKMLs/letter.inkml", INKML.format(label="a"))
            self.assertEqual(module.load_cases(archive, "TestEM2014GT_INKMLs", symbols=True), [])
            self.assertEqual(module.load_cases(archive, "other", symbols=True), [])


if __name__ == "__main__":
    unittest.main()
