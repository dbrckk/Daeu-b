#!/usr/bin/env python3
"""Vérifie les exemples ajoutés aux cours : structure et calculs de référence.

Ces contrôles détectent des régressions mais ne remplacent pas une relecture
universitaire des démonstrations ni une validation humaine sur Android.
"""
from pathlib import Path
from math import exp, isclose, log, sqrt
from statistics import mean, median, pvariance

ROOT = Path(__file__).resolve().parents[1]
CASES = {
    "07-limites-asymptotes.md": "## 7. Atelier guidé",
    "08-continuite-tvi.md": "## 6. Atelier de rédaction",
    "11-statistiques.md": "## 7. Atelier de bout en bout",
    "12-probabilites.md": "## 8. Atelier guidé",
}

def equal(actual, expected, context):
    if not isclose(actual, expected, rel_tol=1e-11, abs_tol=1e-11):
        raise AssertionError(f"{context}: {actual!r} != {expected!r}")

for filename, heading in CASES.items():
    course = (ROOT / "maths" / filename).read_text(encoding="utf-8")
    if heading not in course or "### Deux problèmes de transfert" not in course:
        raise AssertionError(f"{filename}: atelier ou exercices de transfert manquants")
    if "### Corrections commentées" not in course:
        raise AssertionError(f"{filename}: corrections commentées manquantes")
    if course.count("**A.**") < 2 or course.count("**B.**") < 2:
        raise AssertionError(f"{filename}: exercices et réponses A/B manquants")
    for left, right in ((r"\[", r"\]"), (r"\(", r"\)")):
        if course.count(left) != course.count(right):
            raise AssertionError(f"{filename}: délimiteurs mathématiques déséquilibrés")

# Limites : vérification numérique de la division polynomiale et conjugaison.
for x in (-5, -1, 0, 1, 3, 4, 8):
    equal((x*x+4)/(x-2), x+2+8/(x-2), "division rationnelle")
    if x != 1:
        equal((x*x+3)/(x-1), x+1+4/(x-1), "division de transfert")
equal(1-8/(4-2)**2, -1, "dérivée rationnelle")
equal(1-4/(3-1)**2, 0, "dérivée de transfert")
for x in (-4, -1, 1, 7):
    equal((sqrt(x+9)-3)/x, 1/(sqrt(x+9)+3), "conjugaison")
equal(1/(sqrt(9)+3), 1/6, "limite rationalisée")
equal(1/(sqrt(4)+2), 1/4, "limite de transfert")

# TVI : signes, trois dichotomies, croissance et solution exponentielle.
h = lambda x: x**3 + 2*x - 2
for x, y in ((0,-2),(1,1),(.5,-.875),(.75,-.078125),(.875,.419921875)):
    equal(h(x), y, "évaluation en dichotomie")
assert h(.75) < 0 < h(.875)
assert all(3*x*x+2 > 0 for x in [0,.25,.5,.75,1])
root=log(5)/2
assert 0 < root < 1
equal(exp(2*root)-5, 0, "solution exponentielle")
equal(1.5**2-2, .25, "transfert TVI")

# Statistiques : population complète, quartiles par rang français.
obs=[2,4,4,7,8,11]
equal(mean(obs),6,"moyenne")
equal(median(obs),5.5,"médiane")
assert obs[1] == 4 and obs[4] == 8
equal(pvariance(obs),9,"variance population")
equal(sqrt(pvariance(obs)),3,"écart-type")
equal(pvariance([3,4,6,7]),2.5,"comparaison dispersion")
equal(pvariance([1,2,4,5]),2.5,"transfert statistiques")

# Probabilités : formule totale, conditionnelle et absence de remise.
positive=.2*.8+.8*.1
equal(positive,.24,"probabilités totales")
equal((.2*.8)/positive,2/3,"Bayes")
equal(.2*.2/(1-positive),1/19,"conditionnement sur le négatif")
equal((4/7)*(3/6),2/7,"sans remise")
equal((4/7)**2,16/49,"avec remise")
different=.3*.9+.7*.2
equal(different,.41,"transfert probabilités totales")
equal((.3*.9)/different,27/41,"transfert Bayes")
equal((2/5)*(1/4),1/10,"transfert sans remise")
equal((2/5)**2,4/25,"transfert avec remise")

print("OK: 4 ateliers, 8 problèmes de transfert corrigés, invariants mathématiques recalculés.")
