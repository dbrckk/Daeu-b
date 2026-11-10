#!/usr/bin/env python3
"""Copier les 18 cours sources dans l'application, sans dépendances tierces."""
from pathlib import Path
from shutil import copyfile
root=Path(__file__).resolve().parents[1]
source=root/"maths"
output=root/"app"/"cours"
output.mkdir(parents=True,exist_ok=True)
courses=sorted(source.glob("[0-1][0-9]-*.md"))
if len(courses)!=18:raise SystemExit(f"18 cours attendus, trouvés : {len(courses)}")
for chapter in courses:
    copyfile(chapter,output/chapter.name)
    print("Copié :",chapter.name)
print("Synchronisation des 18 cours terminée.")
