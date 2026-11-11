#!/usr/bin/env python3
"""Contrôle éditorial des 60 problèmes de transfert, copies offline et corrigés."""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
ERRORS=[]
def check(ok,message):
    if not ok:ERRORS.append(message)

pattern=re.compile(r"^## T(\d{2}) — Jalon (\d+) : ([^\n]+)$",re.MULTILINE)
expected=list(range(1,21))
for suffix in ("","-b","-c"):
    documents={}
    for kind in ("sujets","corriges"):
        name=f"{kind}{suffix}.md"
        source=ROOT/"transferts"/name
        offline=ROOT/"app"/"transferts"/name
        check(source.is_file(),f"Source manquante : {name}")
        check(offline.is_file(),f"Copie PWA manquante : {name}")
        if not source.is_file() or not offline.is_file():continue
        check(source.read_bytes()==offline.read_bytes(),f"Copie PWA différente : {name}")
        documents[kind]=source.read_text(encoding="utf-8")

    for kind,content in documents.items():
        headings=list(pattern.finditer(content))
        ids=[int(m.group(1)) for m in headings]
        jalons=[int(m.group(2)) for m in headings]
        check(ids==expected,f"{kind}{suffix} : ordre des problèmes incorrect : {ids}")
        check(jalons==expected,f"{kind}{suffix} : attribution des jalons incorrecte : {jalons}")
        for i,heading in enumerate(headings):
            section=content[heading.end():(headings[i+1].start() if i+1<len(headings) else len(content))]
            numbers=[int(n) for n in re.findall(r"^(\d+)\. ",section,re.MULTILINE)]
            check(numbers==[1,2,3],f"{kind}{suffix} T{i+1:02} : 3 étapes attendues, trouvé {numbers}")
            check(section.count("$")%2==0,f"{kind}{suffix} T{i+1:02} : délimiteurs mathématiques incohérents")
    if set(documents)=={"sujets","corriges"}:
        titles=lambda kind:[m.group(3) for m in pattern.finditer(documents[kind])]
        check(titles("sujets")==titles("corriges"),f"Série {suffix or 'A'} : titres sujet/corrigé différents")
        check("**Auto-évaluation" not in documents["sujets"],"Grille révélée dans les sujets")
        check(documents["corriges"].count("**Auto-évaluation")==20,
              f"Série {suffix or 'A'} : 20 grilles de raisonnement attendues")

if ERRORS:
    for error in ERRORS:print("ERREUR :",error)
    sys.exit(1)
print("OK : 60 problèmes originaux, 180 questions, 60 corrigés/grilles et copies PWA cohérentes.")
