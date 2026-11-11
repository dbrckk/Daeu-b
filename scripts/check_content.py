#!/usr/bin/env python3
"""Vérifie la structure et les liens Markdown internes du cours, sans dépendance."""

from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MODULE_DIR = ROOT / "maths"
EXPECTED_MODULES = [f"{number:02d}" for number in range(18)]
errors = []

markdown_files = sorted(ROOT.rglob("*.md"))
paths = {p.resolve() for p in markdown_files}
if len(markdown_files) < 27:
    errors.append(f"Nombre de documents Markdown trop faible : {len(markdown_files)}")

for number in EXPECTED_MODULES:
    matches = list(MODULE_DIR.glob(f"{number}-*.md"))
    if len(matches) != 1:
        errors.append(f"Module {number}: attendu 1 fichier, trouvé {len(matches)}")

for path in markdown_files:
    text = path.read_text(encoding="utf-8")
    if not text.lstrip().startswith("# "):
        errors.append(f"{path.relative_to(ROOT)} : titre H1 manquant")
    for match in re.finditer(r"(?<!!)\[[^\]]+\]\(([^)]+)\)", text):
        dest = match.group(1).strip().split()[0]
        if not dest or dest.startswith(("#", "http:", "https:", "mailto:")):
            continue
        relative_part = unquote(urlsplit(dest).path)
        target = (path.parent / relative_part).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"{path.relative_to(ROOT)} : lien hors dépôt {dest}")
            continue
        if not target.exists():
            errors.append(f"{path.relative_to(ROOT)} : lien brisé {dest}")

# Invariant pédagogique critique : le calcul intégral (jalon 18) est obligatoire
# dans le programme SONATE Côte d'Azur 2026-2027.
programme = (ROOT / "PROGRAMME.md").read_text(encoding="utf-8")
suivi = (ROOT / "SUIVI.md").read_text(encoding="utf-8")
if "| 18 | Calcul intégral | 15 | Programme |" not in programme:
    errors.append("Jalon 18 : calcul intégral obligatoire absent du programme")
if "| 15 Intégrales |" not in suivi or "| 15 Intégrales* |" in suivi:
    errors.append("Suivi : intégrales (cours 15) classées facultatives à tort")

for base in ("01", "02", "03"):
    glob_expr = f"blanc-{base}*sujet.md"
    if len(list((ROOT / "examens").glob(glob_expr))) != 1:
        errors.append(f"Sujet blanc {base} manquant")
    glob_expr = f"blanc-{base}*corrige.md"
    if len(list((ROOT / "examens").glob(glob_expr))) != 1:
        errors.append(f"Corrigé blanc {base} manquant")

if errors:
    for error in errors:
        print("ERREUR:", error)
    sys.exit(1)

print(f"OK: {len(markdown_files)} documents, 18 modules (00 à 17), liens locaux valides et 3 examens corrigés.")
