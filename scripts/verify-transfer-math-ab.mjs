/** 40 vérifications indépendantes des résultats A/B, sans dépendance.
 * Limite : une égalité vérifiée n'établit pas la qualité de la démonstration.
 */
const near=(x,y,eps=1e-8)=>Number.isFinite(x)&&Math.abs(x-y)<=eps*Math.max(1,Math.abs(x),Math.abs(y));
const gcd=(a,b)=>b?gcd(b,a%b):a;
const h=x=>16-(x-4)**2;
const A=[
  126===14*9&&126-18===12*9,
  near(200*(1-3/5-1/4),30),
  near(Math.sqrt(18),3*Math.sqrt(2))&&4.24**2<18&&4.25**2>18,
  [0,3,10].every(x=>near((x+2)*(x+5),x*x+7*x+10))&&(3+2)*(3+5)===40,
  near(5+1.8*10,23),
  10+10===20&&9*10+5*10===140,
  [0,4,8].map(h).join()==="0,16,0"&&h(2)===12&&h(6)===12,
  -3*(-1.5-2)>9&&!(-3*(-1-2)>9),
  near((4+6+6+8+11)/5,7)&&[4,6,6,8,11][2]===6&&11-4===7,
  near((-8+1)/(-4-3),1)&&near(1/(-3),-1/3),
  [-1e-5,1e-5].every(t=>near(((3+t)**2-9)/t,6+t)),
  near(-(6*6)+12*6-20,16)&&-2*5+12>0&&-2*7+12<0,
  [-1,1].every(x=>2*x*x+1===3&&x*x-1===0)&&near((2*1e8+1)/(1e8-1),2,1e-7),
  near(1.2**3+1.2-3,-0.072)&&near(1.3**3+1.3-3,0.497),
  near(150*1.08**3,188.9568)&&near(150*1.08**4,204.073344),
  near(100*Math.exp(0.2*5*Math.log(2)),200)&&near(5*Math.log(2),3.47,.005),
  40*2**(6/3)===160&&40*2**(9/3)===320,
  (2**3+2**2)-(0**3+0**2)===12&&12/2===6,
  near(5/8*4/7,5/14)&&near(5/8*3/7+3/8*5/7,15/28),
  near(.2+.5+.3,1)&&near(.5+2*.3,1.1)&&near(.5+4*.3-1.1**2,.49)
];
const B=[
  gcd(84,60)===12&&84/12===7&&60/12===5&&84%15!==0,
  near(180*(1-1/3)*(1-1/4),90),
  Math.abs(14-18)>3&&Math.abs(21-18)===3,
  [0,4,10].every(x=>near((x+3)**2-x*x,6*x+9))&&6*4+9===33,
  near((26/5-1)/3+(26/5+2)/2,5),
  10+20===30&&12*10+7*20===260,
  [0,4,6,8,12].every(x=>near(x*(12-x),36-(x-6)**2))
    &&6*(12-6)===36&&4*(12-4)===32,
  90+30*8===330&&90+30*9===360,
  near((2+4+4+4+10)/5,4.8)&&[2,4,4,4,10][2]===4&&10-2===8,
  near(Math.sqrt(3+1)/(3-2),2)&&Math.sqrt(-1+1)/(-1-2)===0,
  [-10000,10000].every(x=>near((3*x*x-x)/(x*x+2),3,.0002)),
  [0,1,3,4].map(x=>x**3-6*x*x+9*x).join()==="0,4,0,4"
    &&3*(2-1)*(2-3)<0,
  [-2,0,2,10].every(x=>near((x*x+1)/(x-1),x+1+2/(x-1)))
    &&near((10000**2+1)/(10000-1)-10001,0,.00025),
  near(1.3**3+1.3-4,-.503)&&near(1.4**3+1.4-4,.144),
  14+5*17===99&&14+5*18===104&&6*(14+39)/2===159,
  near(Math.log(2*3-1),Math.log(5))&&2/(2*3-1)>0,
  near(300*Math.exp(-.1*10*Math.log(2)),150)&&near(10*Math.log(2),6.93,.005),
  (4**2+3*4)-(1**2+3*1)===24&&24/3===8,
  near((3/5)**2,9/25)&&near(2*(3/5)*(2/5),12/25)&&near(1-9/25,16/25),
  near(1/4+3/4,1)&&near(-2/4+3*(3/4),7/4)&&near(4/4+9*(3/4),31/4)&&near(31/4-(7/4)**2,75/16)
];
if(A.length!==20||B.length!==20)throw Error("Séries A/B : liste d'invariants incomplète");
for(const [name,rows] of [["A",A],["B",B]]){
  for(const [i,passed] of rows.entries())
    if(passed!==true)throw Error("Incohérence mathématique "+name+String(i+1).padStart(2,"0"));
}
console.log("OK : 40 contrôles A/B sur le calcul numérique et les contraintes.");
