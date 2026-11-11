#!/usr/bin/env python3
"""Contrôler les 20 transferts, leurs corrigés et leurs copies hors connexion."""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
ERRORS=[]
def check(ok,message):
    if not ok:ERRORS.append(message)

paths={}
for name in ("sujets.md","corriges.md"):
    source=ROOT/"transferts"/name
    offline=ROOT/"app"/"transferts"/name
    check(source.is_file(),f"Document absent : {source}")
    check(offline.is_file(),f"Copie hors ligne absente : {offline}")
    if not source.is_file() or not offline.is_file():continue
    check(source.read_bytes()==offline.read_bytes(),f"Copie hors ligne différente : {name}")
    paths[name]=source.read_text(encoding="utf-8")

pattern=re.compile(r"^## T(\d{2}) — Jalon (\d+) : ([^\n]+)$",re.MULTILINE)
expected=list(range(1,21))
for name,content in paths.items():
    headings=list(pattern.finditer(content))
    ids=[int(m.group(1)) for m in headings]
    jalons=[int(m.group(2)) for m in headings]
    check(ids==expected,f"{name} : ordre ou nombre des problèmes incorrect : {ids}")
    check(jalons==expected,f"{name} : jalons non alignés : {jalons}")
    for i,match in enumerate(headings):
        start=match.end()
        end=headings[i+1].start() if i+1<len(headings) else len(content)
        section=content[start:end]
        questions=[int(x) for x in re.findall(r"^(\d+)\. ",section,re.MULTILINE)]
        check(questions==[1,2,3],f"{name} T{i+1:02} : les trois étapes ne sont pas alignées : {questions}")
        check(section.count("$")>=2 and section.count("$")%2==0,f"{name} T{i+1:02} : formules absentes ou délimiteurs incorrects")
if set(paths)=={"sujets.md","corriges.md"}:
    left=[m.group(3) for m in pattern.finditer(paths["sujets.md"])]
    right=[m.group(3) for m in pattern.finditer(paths["corriges.md"])]
    check(left==right,"Titres des sujets et corrigés divergents")
    check("Auto-évaluation raisonnement" not in paths["sujets.md"],"La grille de correction apparaît dans le sujet")
    count=paths["corriges.md"].count("**Auto-évaluation raisonnement")
    check(count==20,f"Grilles de raisonnement : {count} au lieu de 20")

if ERRORS:
    for problem in ERRORS:print("ERREUR :",problem)
    sys.exit(1)
print("OK : 20 problèmes de transfert et 60 questions, solutions distinctes, 20 grilles, copies PWA identiques.")
