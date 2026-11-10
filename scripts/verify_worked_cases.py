#!/usr/bin/env python3
"""Vérifie les exemples ajoutés aux cours : structure et calculs de référence.

Ces contrôles détectent des régressions mais ne remplacent pas une relecture
universitaire des démonstrations ni une validation humaine sur Android.
"""
from pathlib import Path
from fractions import Fraction
from math import exp, isclose, log, sqrt
from statistics import mean, median, pvariance

ROOT = Path(__file__).resolve().parents[1]
CASES = {
    "07-limites-asymptotes.md": "## 7. Atelier guidé",
    "08-continuite-tvi.md": "## 6. Atelier de rédaction",
    "11-statistiques.md": "## 7. Atelier de bout en bout",
    "12-probabilites.md": "## 8. Atelier guidé",
    "01-calcul-numerique.md": "## 7. Atelier approfondi",
    "03-equations-inequations-systemes.md": "## 8. Atelier approfondi",
    "04-second-degre.md": "## 7. Atelier approfondi",
    "06-derivation.md": "## 8. Atelier approfondi",
    "10-suites.md": "## 8. Atelier approfondi",
    "15-primitives-integrales.md": "## 8. Atelier approfondi",
    "02-calcul-litteral.md": "## 7. Atelier approfondi",
    "05-fonctions.md": "## 7. Atelier approfondi",
    "09-exponentielle-logarithme.md": "## 7. Atelier approfondi",
    "17-raisonnement-modelisation.md": "## 9. Atelier approfondi",
    "13-trigonometrie.md": "## 7. Atelier approfondi",
    "14-geometrie-vectorielle.md": "## 7. Atelier approfondi",
    "16-complexes-complements.md": "## 8. Atelier approfondi",
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

# Calcul exact : fractions et compositions de pourcentages.
equal(120*1.2*.75,108,"hausse puis baisse")
equal(108/120-1,-.10,"variation totale")
equal(102/.85,120,"prix avant remise")
assert (Fraction(3,4)-Fraction(2,3))/Fraction(5,6) == Fraction(1,10)
equal(250*1.12*.9,252,"transfert de pourcentage")
equal(1.12*.9-1,.008,"hausse de 0,8 %")
assert (Fraction(5,6)+Fraction(1,4))*Fraction(12,13)==1

# Systèmes et tableaux de signes, en testant chaque intervalle.
x,y=5,2
assert 3*x+2*y==19 and x-y==3
x,y=4,3
assert 2*x+3*y==17 and x+y==7
main_fraction=lambda x:(2*x-6)/(x+1)
assert main_fraction(-2)>0 and main_fraction(0)<0 and main_fraction(3)==0 and main_fraction(4)>0
transfer_fraction=lambda x:(x-4)/(x+2)
assert transfer_fraction(-3)>0 and transfer_fraction(0)<0
assert transfer_fraction(4)==0 and transfer_fraction(5)>0

# Second degré : formes équivalentes, racines et maxima sur un domaine.
for x in (-2,0,1,3,5,6,10):
    b=-2*x*x+12*x-10
    equal(b,-2*(x-3)**2+8,"forme canonique bénéfice")
    equal(b,-2*(x-1)*(x-5),"forme factorisée bénéfice")
equal(-2*3**2+12*3-10,8,"maximum bénéfice")
assert -2*1*1+12*1-10==0 and -2*5*5+12*5-10==0
for x in (-2,0,1,2,3,5):
    equal(2*x*x-8*x+6,2*(x-2)**2-2,"transfert canonique")
equal(2*2**2-8*2+6,-2,"transfert minimum")
equal(-(4**2)+8*4-7,9,"transfert bénéfice")

# Dérivation : images, dérivées et tangentes.
f=lambda x:x**3-6*x*x+9*x+1
derivative=lambda x:3*x*x-12*x+9
for x in (-3,0,1,2,3,6):
    equal(derivative(x),3*(x-1)*(x-3),"dérivée factorisée")
equal(f(1),5,"maximum local")
equal(f(3),1,"minimum local")
equal(f(2),3,"point tangence")
equal(derivative(2),-3,"pente tangente")
equal(-3*2+9,f(2),"équation tangente")
equal(2*3-2,3**2-4*3+7,"transfert tangente")
equal((-1)**3-3*(-1),2,"transfert maximum")
equal(1**3-3*1,-2,"transfert minimum")

# Suites : formules explicites, seuil entier, somme et point fixe.
u=lambda n:160*(1.25**n)
equal(sum(u(n) for n in range(4)),922.5,"somme géométrique")
equal(u(4),390.625,"rang précédent seuil")
equal(u(5),488.28125,"rang du seuil")
assert u(4)<400<=u(5)
assert 4<log(2.5)/log(1.25)<5
transfer=lambda n:80*(1.5**n)
equal(sum(transfer(n) for n in range(3)),380,"somme transfert")
assert transfer(3)<300<=transfer(4)
v=lambda n:20-16*(.75**n)
equal(v(0),4,"suites affines valeur initiale")
equal(v(1),8,"suites affines terme 1")
equal(v(2),11,"suites affines terme 2")
for n in range(6):
    equal(v(n+1),.75*v(n)+5,"récurrence affine")

# Intégrales : différences de primitive aux bornes et vérification analytique.
F=lambda x:x**3-2*x*x+x
equal(F(2)-F(0),2,"intégrale signée")
equal((F(2)-F(0))/2,1,"valeur moyenne")
for x in (-2,0,.25,.5,1,2):
    equal(3*x*x-4*x+1,(3*x-1)*(x-1),"signes de l'intégrande")
G=lambda x:x*x-2*x
equal(G(2)-G(0),0,"intégrale signée de transfert")
equal(1+1,2,"aire décomposée")
H=lambda x:2*x**3+x*x
equal(H(1)-H(0),3,"intégrale polynomiale transfert")
equal(exp(1)-exp(0),exp(1)-1,"primitive exponentielle")

# Calcul littéral : expressions équivalentes uniquement sur le domaine initial.
for x in [-5,-2,0,2,4,8]:
    equal((x*x-9)/(x-3)+2/(x+1),
          (x*x+4*x+5)/(x+1),"simplification rationnelle")
    if x != 2:  # valeur interdite par le dénominateur initial
        equal((x*x-4)/(x-2)-1/(x+1),
              (x*x+3*x+1)/(x+1),"transfert rationalisation")
equal((-9)/(-3)+2,5,"évaluation de l'expression")
for x in [-2,0,1,2,3,5]:
    equal((2*x-3)**2-(x-1)**2,(x-2)*(3*x-4),"différence de carrés")
equal((2*(4/3)-3)**2-((4/3)-1)**2,0,"racine factorisée")

# Fonctions : intersection des domaines et images.
f=lambda x:sqrt(x+2)/(x-1)
equal(f(-2),0,"image en borne autorisée")
equal(f(2),2,"image en deux")
g=lambda x:sqrt(5-x)/(x+1)
equal(g(4),.2,"image avec racine et quotient")
q=lambda x:(x-2)**2-1
equal(q(0),3,"image et antécédents")
equal(q(2),-1,"minimum parabole")
equal(q(1),0,"premier antécédent")
equal(q(3),0,"second antécédent")

# Logarithmes et exponentielles : domaines et substitution.
equal(log(2*3-1),log(3+2),"égalité logarithmique")
assert 3 > .5 and (2*3-1)>0 and (3+2)>0
equal(exp(2*(log(7)/2)),7,"inéquation frontière")
doubling=log(2)/.15
equal(240*exp(.15*doubling),480,"doublement continu")
equal(log(3-2),0,"transfert logarithme")
equal(1/(3-2),1,"dérivée logarithmique")
half_life=log(2)/.3
equal(exp(-.3*half_life),.5,"demi-vie exponentielle")
assert half_life>0

# Rédaction : racines extrinsèques écartées et contraintes entières.
equal(sqrt(3+1),3-1,"racine originale valide")
assert sqrt(0+1) != 0-1  # Racine parasite introduite par mise au carré.
equal(sqrt(5+4),5-2,"transfert racine valide")
assert sqrt(0+4) != 0-2
benefit=lambda n:9*n-(60+4*n)
equal(benefit(12),0,"seuil strict non franchi")
equal(benefit(13),5,"premier entier rentable")

# Trigonométrie : valeurs exactes et dérivées.
from math import sin, cos, pi
equal(150*pi/180,5*pi/6,"conversion radians")
equal(sin(5*pi/6),.5,"sinus quadrant II")
equal(cos(5*pi/6),-sqrt(3)/2,"cosinus quadrant II")
equal(sin(7*pi/6),-.5,"sinus quadrant III")
equal(cos(7*pi/6),-sqrt(3)/2,"cosinus quadrant III")
equal(cos(2*pi/3),-.5,"cosinus équation")
equal(cos(4*pi/3),-.5,"deuxième solution cosinus")
equal(-3*sin(0)+4*cos(0),4,"dérivée trigonométrique")

# Géométrie : déterminant, équations, produit scalaire et distances.
assert 4*4-2*2==12
assert 1-2*2+3==0 and 5-2*4+3==0
equal(abs(3-2*6+3)/sqrt(1+4),6/sqrt(5),"distance à AB")
assert 2-2*5+2 != 0
assert 2*1+(-1)*2 == 0
equal(abs(2*3-0-4)/sqrt(4+1),2/sqrt(5),"distance transfert")

# Complexes : multiplication, division et rotation autour d'un centre.
z,w=1+2j,2-1j
assert z*w==4+3j
equal(abs(z*w),5,"module multiplicatif")
assert abs(z/w-1j)<1e-12
center=1+1j
point=3+1j
image=center+1j*(point-center)
assert image==1+3j
equal(abs(point-center),abs(image-center),"isométrie rotation")
assert (2+1j)*(1-3j)==5-5j
equal(abs(5-5j),5*sqrt(2),"module transfert")
assert abs((2+1j)/(1-3j)-(-.1+.7j))<1e-12
center=2+0j
point=3+2j
image=center-(point-center)
assert image==1-2j
equal(abs(point-center),abs(image-center),"rotation de pi")

print("OK: 17 ateliers, 34 problèmes de transfert corrigés, invariants mathématiques recalculés.")
