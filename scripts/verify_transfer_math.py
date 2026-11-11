#!/usr/bin/env python3
"""Oracles arithmétiques indépendants pour les 20 situations C.
Ne remplace pas une relecture humaine des démonstrations et des conditions.
"""
from fractions import Fraction as F
from math import gcd, log, sqrt, isclose

def close(a, b, tol=1e-9):
    return isclose(float(a), float(b), rel_tol=tol, abs_tol=tol)

oracles = {
    1: gcd(168, 126)==42 and 168//42==4 and 126//42==3 and 168%40!=0,
    2: F(240)*(1-F(3,8))*(1-F(1,3))==100 and 240-90-50==100,
    3: 5.6<sqrt(32)<5.7 and round(sqrt(32),2)==5.66,
    4: all(x*x+2*x-15==(x-3)*(x+5) for x in range(-20,21))
        and (3-3)*(3+5)==0 and (-5-3)*(-5+5)==0,
    5: F(5,2)!=1 and (F(5,2)+2)/(F(5,2)-1)==3,
    6: 11+6==17 and 11-6==5 and 2*(11+6)==34 and 11*6==66,
    7: all(-t*t+6*t+7==-(t-3)**2+16 for t in range(8))
       and -7**2+6*7+7==0
       and all(-t*t+6*t+7>=12 for t in range(1,6))
       and -0**2+6*0+7<12 and -(6)**2+6*6+7<12,
    8: 5-2*2==1 and 5-2*3<1 and not (-1>-1),
    9: F(2*10+3*12+5*16,10)==F(68,5) and F(12+16,2)==14,
    10: F(1,5)==F(1,5) and sqrt(5-5)/(5+1)==0,
    11: close(((2+1e-6)**2-4)/(2+1e-6-2),4,tol=1e-5)
        and close(((2-1e-6)**2-4)/(2-1e-6-2),4,tol=1e-5),
    12: (1**2+1)**2==4
        and close(((1+1e-5)**2+1)**2-((1-1e-5)**2+1)**2,16e-5)
        and 8*1-4==4,
    13: all(close((x*x-4)/(x-1),x+1-3/(x-1)) for x in (-10,-2,0,2,10))
        and close(((10000**2-4)/(10000-1))-10001,0,tol=1e-3),
    14: 1**3+1-5<0 and 2**3+2-5>0
        and 1.5**3+1.5-5<0 and 1.6**3+1.6-5>0,
    15: close(240*F(9,10)**4,F(157464,1000))
        and close(240*F(9,10)**5,F(1417176,10000))
        and 240*F(9,10)**4>=150 and 240*F(9,10)**5<150,
    16: close(log(4-2)+log(4-1),log(6)) and not -1>2,
    17: close(120*__import__("math").exp((2*log(2))/2),240)
        and close(2*log(2),1.39,tol=0.005),
    18: F(4*3)-F(3*3,2)==F(15,2) and F(15,2)/3==F(5,2),
    19: F(2,100)*F(95,100)==F(19,1000)
        and F(98,100)*F(5,100)==F(49,1000)
        and F(19,1000)/(F(19,1000)+F(49,1000))==F(19,68),
    20: F(1,2)+F(1,3)+F(1,6)==1
        and 3*F(1,3)+6*F(1,6)==2
        and 9*F(1,3)+36*F(1,6)==9
        and 9-2**2==5,
}
for id_, result in oracles.items():
    if not result:
        raise AssertionError(f"Jalon C{id_:02}: un invariant mathématique est faux")
if len(oracles)!=20 or set(oracles)!=set(range(1,21)):
    raise AssertionError("Oracles incomplets")
print("OK : 20/20 oracles C (calculs, signes, domaines et arrondis indépendants).")
