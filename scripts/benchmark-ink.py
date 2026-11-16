"""Compare a local ink reader against Google's MathWriting InkML archive."""
import argparse
from collections import Counter
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tarfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {"i": "http://www.w3.org/2003/InkML"}
SIMPLE = re.compile(r"[0-9x+*/().=\-]+")
DIGIT = re.compile(r"[0-9]")
NODE = """
import {readFileSync} from 'node:fs';
import {recognizeNumericInk} from './app/numeric-ink.mjs';
import {recognizeEquationInk} from './app/equation-ink.mjs';
import {encodeStroke, PAPER_WIDTH, PAPER_HEIGHT} from './app/workbook.mjs';

const samples = JSON.parse(readFileSync(0, 'utf8'));
const outputs = samples.map(({paths, suite}) => {
  const points = paths.flat();
  const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
  const left = Math.min(...xs), right = Math.max(...xs);
  const top = Math.min(...ys), bottom = Math.max(...ys);
  const scale = Math.min((PAPER_WIDTH - 40) / (right - left || 1),
    (PAPER_HEIGHT - 40) / (bottom - top || 1), 70 / (bottom - top || 1));
  const page = paths.map(path => {
    const count = Math.min(path.length, 180);
    return encodeStroke(Array.from({length: count}, (_, i) => {
      const [x, y] = path[Math.round(i * (path.length - 1) / Math.max(1, count - 1))];
      return [20 + (x - left) * scale, 20 + (y - top) * scale];
    }));
  });
  const proposal = suite === 'digits' ? recognizeNumericInk(page) : recognizeEquationInk(page);
  return proposal.status === 'recognized' ? proposal.text : null;
});
console.log(JSON.stringify(outputs));
"""


def load_samples(archive):
    samples = []
    totals = Counter()
    with tarfile.open(archive, "r:gz") as inks:
        for member in inks:
            if not member.isfile() or not member.name.endswith(".inkml"):
                continue
            path = PurePosixPath(member.name)
            split = path.parent.name
            if split not in {"test", "symbols"}:
                continue
            totals[split] += 1
            root = ET.fromstring(inks.extractfile(member).read())
            label = root.findtext("i:annotation[@type='normalizedLabel']", namespaces=NS)
            label = label or root.findtext("i:annotation[@type='label']", namespaces=NS)
            text = re.sub(r"\s+", "", label or "")
            if split == "test":
                text = text.replace(r"\cdot", "*").replace(r"\times", "*")
                if not SIMPLE.fullmatch(text) or text.count("=") != 1 or not all(text.split("=")):
                    continue
            elif not DIGIT.fullmatch(text):
                continue
            paths = [
                [tuple(map(float, point.split()[:2])) for point in trace.text.split(",") if point.strip()]
                for trace in root.findall("i:trace", NS) if trace.text
            ]
            if paths and all(paths):
                samples.append({"id": path.stem, "suite": "digits" if split == "symbols" else "equations",
                                "expected": text, "paths": paths})
    return samples, totals


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--details", action="store_true", help="Print mismatches and abstentions")
    args = parser.parse_args()
    samples, totals = load_samples(args.archive)
    if not samples:
        parser.error("No eligible MathWriting test equations or digit symbols")
    result = subprocess.run(["node", "--input-type=module", "-e", NODE], cwd=ROOT,
                            input=json.dumps(samples), text=True, capture_output=True, check=True)
    scores = {"digits": Counter(), "equations": Counter()}
    for sample, proposal in zip(samples, json.loads(result.stdout), strict=True):
        outcome = "exact" if proposal == sample["expected"] else "abstained" if proposal is None else "wrong"
        scores[sample["suite"]][outcome] += 1
        if args.details and outcome != "exact":
            print(f"{sample['suite']} {sample['id']}: {sample['expected']!r} → {proposal!r}")
    print(f"MathWriting examined: {totals['test']} test expressions, {totals['symbols']} extracted symbols")
    for suite, score in scores.items():
        print(f"{suite}: {score.total()} eligible, {score['exact']} exact, "
              f"{score['wrong']} wrong, {score['abstained']} abstained")


if __name__ == "__main__":
    main()
