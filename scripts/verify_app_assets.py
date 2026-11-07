#!/usr/bin/env python3
"""Vérifie la cohérence des sujets progressifs et les ressources de l'application."""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/"app"
ERRORS=[]

def error(message):
    ERRORS.append(message)

sujet=(ROOT/"problemes"/"sujets.md").read_text(encoding="utf-8")
corrige=(ROOT/"problemes"/"corriges.md").read_text(encoding="utf-8")
source_matches=list(re.finditer(r"^### P([1-8])\.",sujet,re.MULTILINE))
correction_matches=list(re.finditer(r"^## P([1-8]) —",corrige,re.MULTILINE))
src_ids=[int(m.group(1)) for m in source_matches]
solution_ids=[int(m.group(1)) for m in correction_matches]
if src_ids!=list(range(1,9)): error(f"Sujets manquants ou mal ordonnés : {src_ids}")
if solution_ids!=list(range(1,9)): error(f"Corrigés manquants ou mal ordonnés : {solution_ids}")

total=0
for i in range(min(len(source_matches),len(correction_matches))):
    src_start=source_matches[i].end()
    src_end=source_matches[i+1].start() if i+1<len(source_matches) else len(sujet)
    corr_start=correction_matches[i].end()
    corr_end=correction_matches[i+1].start() if i+1<len(correction_matches) else len(corrige)
    source_part=sujet[src_start:src_end]
    solution_part=corrige[corr_start:corr_end]
    numbers=[int(x) for x in re.findall(r"^(\d+)\. ",source_part,re.MULTILINE)]
    sol_numbers=[int(x) for x in re.findall(r"^(\d+)\. ",solution_part,re.MULTILINE)]
    if numbers!=list(range(1,len(numbers)+1)) or not numbers:
        error(f"P{i+1} : numérotation sujet invalide {numbers}")
    if sol_numbers!=numbers:
        error(f"P{i+1} : questions/corrigés incohérents {numbers} / {sol_numbers}")
    total+=len(numbers)
if total!=37: error(f"Le nombre de sous-questions est {total}, attendu 37")

for module in APP.glob("*.mjs"):
    contents=module.read_text(encoding="utf-8")
    for relative in re.findall(r'''(?:from|import)\s*["'](\./[^"']+)["']''',contents):
        target=module.parent/relative
        if not target.is_file(): error(f"Import cassé : {module.name} -> {relative}")

html=(APP/"index.html").read_text(encoding="utf-8")
element_ids=set(re.findall(r'\bid="([^"]+)"',html))
for module in ("app.mjs","exam-ui.mjs"):
    text=(APP/module).read_text(encoding="utf-8")
    for requested in re.findall(r'\b(?:el|byId)\("([^"]+)"\)',text):
        if requested not in element_ids: error(f"ID absent du HTML : {module} -> {requested}")

worker=(APP/"sw.js").read_text(encoding="utf-8")
asset_match=re.search(r"const ASSETS\s*=\s*\[([^\]]+)\]",worker)
if not asset_match:
    error("Liste d'assets hors-ligne introuvable")
else:
    for asset in re.findall(r'"(\./[^"]+)"',asset_match.group(1)):
        if asset=="./": continue
        if not (APP/asset[2:]).is_file():error(f"Cache hors ligne : fichier manquant {asset}")
    for name in ("exam-ui.mjs","reasoning.mjs","exam-analytics.mjs","exam-engine.mjs"):
        if f'"./{name}"' not in asset_match.group(1):error(f"Cache hors ligne : module manquant {name}")

if ERRORS:
    for e in ERRORS: print("ERREUR:",e)
    sys.exit(1)
print(f"OK : {len(source_matches)} problèmes, {total} questions corrigées, imports, IDs HTML et cache hors ligne cohérents.")
