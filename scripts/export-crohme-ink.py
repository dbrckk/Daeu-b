"""Select DAEU B-style handwriting from the labelled CROHME 2014 test split."""
import argparse
import json
from pathlib import PurePosixPath
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

NS = {"i": "http://www.w3.org/2003/InkML"}
FRACTION = r"\\frac\{[0-9]+\}\{[0-9]+\}"
EXPRESSION = re.compile(rf"(?:{FRACTION}|\^2|[0-9x+*/().=\-])+")
SINGLE_FRACTION = re.compile(FRACTION)


def load_cases(path):
    cases = []
    with ZipFile(path) as archive:
        for name in sorted(archive.namelist()):
            item = PurePosixPath(name)
            if item.parent.name != "TestEM2014GT_INKMLs" or item.suffix != ".inkml" or item.name.startswith("."):
                continue
            root = ET.fromstring(archive.read(name))
            label = root.findtext("i:annotation[@type='truth']", namespaces=NS) or ""
            label = re.sub(r"\s+", "", label.strip().strip("$"))
            label = re.sub(r"\\(?:left|right)", "", label).replace("^{2}", "^2")
            if not EXPRESSION.fullmatch(label):
                continue
            if SINGLE_FRACTION.fullmatch(label):
                group = "crohme-isolated-fraction"
            elif label.count("=") == 1 and all(label.split("=")):
                group = "crohme-fraction-equation" if r"\frac" in label else "crohme-equation"
            else:
                continue
            paths = [[list(map(float, point.split()[:2])) for point in trace.text.split(",") if point.strip()]
                     for trace in root.findall("i:trace", NS) if trace.text]
            if paths and all(paths):
                cases.append({"id": item.stem, "expected": label, "paths": paths, "group": group})
    return cases


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", help="Labelled online formula valid.zip from CROHME")
    args = parser.parse_args()
    cases = load_cases(args.zip)
    if not cases:
        parser.error("No eligible labelled CROHME 2014 cases in archive")
    print(json.dumps(cases))
