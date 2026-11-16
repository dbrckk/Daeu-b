"""Select DAEU B-style handwriting from a CROHME split."""
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


def normalize_label(label, contextual):
    label = re.sub(r"\s+", "", label.strip().strip("$"))
    label = re.sub(r"\\(?:left|right)", "", label).replace("^{2}", "^2")
    if contextual:
        label = label.replace(r"\times", "*").replace(r"\cdot", "*")
        # Preserve the fraction's argument braces while unwrapping isolated numbers.
        label = re.sub(rf"({FRACTION})|\{{([0-9x]+)\}}",
                       lambda match: match[1] or match[2], label)
        if len(label) > 45:
            return ""
    return label


def load_cases(path, split, labels=None):
    cases = []
    with ZipFile(path) as archive:
        for name in sorted(archive.namelist()):
            item = PurePosixPath(name)
            if item.parent.name != split or item.suffix != ".inkml" or item.name.startswith("."):
                continue
            root = ET.fromstring(archive.read(name))
            raw_label = (labels.get(item.name) if labels is not None else
                         root.findtext("i:annotation[@type='truth']", namespaces=NS))
            label = normalize_label(raw_label or "", labels is not None)
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
    parser.add_argument("zip", help="CROHME online formula archive")
    parser.add_argument("--split", default="TestEM2014GT_INKMLs", help="Directory containing the InkML files")
    parser.add_argument("--labels", type=argparse.FileType("r", encoding="utf-8"),
                        help="CROHME Contextual Dataset JSON for separately labelled traces")
    args = parser.parse_args()
    labels = {row["input_file"]: row["input_latex"] for row in json.load(args.labels)} if args.labels else None
    cases = load_cases(args.zip, args.split, labels)
    if not cases:
        parser.error(f"No eligible labelled CROHME cases in {args.split}")
    print(json.dumps(cases))
