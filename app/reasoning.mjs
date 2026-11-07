/**
 * Auto-correction guidée de la rédaction, séparée de la note automatique.
 * Les modèles ne sont affichés qu'après la remise de la copie.
 * Les cases cochées sont des déclarations de l'apprenant, pas une correction IA.
 */
export const RUBRICS={
  "a-analyse":{
    intro:"Compare d'abord ton tableau de variations et tes calculs au modèle, puis coche uniquement les étapes réellement présentes et justifiées dans ta copie.",
    steps:[
      {id:"domain",prompt:"Ai-je défini l'intervalle et justifié qu'il est pertinent ?",model:"Le modèle s'étudie pour x ∈ [0;12]. La production ne peut pas être négative ; toutes les conclusions d'optimisation concernent cet intervalle.",lesson:"05-fonctions.md"},
      {id:"derivative",prompt:"Ai-je calculé la dérivée et étudié son signe ?",model:"B(x)=−x²+12x−20, donc B′(x)=−2x+12. B′>0 sur [0;6[, B′(6)=0 et B′<0 sur ]6;12].",lesson:"06-derivation.md"},
      {id:"maximum",prompt:"Ai-je démontré la valeur et l'emplacement du maximum ?",model:"B croît de 0 à 6, puis décroît de 6 à 12. Le maximum est atteint pour x=6, et B(6)=16. Il faut distinguer le point optimal de sa valeur.",lesson:"06-derivation.md"},
      {id:"sign",prompt:"Ai-je résolu correctement la condition de bénéfice positif et interprété les bornes ?",model:"B(x)=−(x−2)(x−10). Les racines sont 2 et 10. B(x)>0 exactement pour 2<x<10 sur [0;12] ; les deux bornes donnent B=0 et sont donc exclues.",lesson:"04-second-degre.md"}
    ]},
  "a-suites":{
    intro:"Contrôle le passage du pourcentage à la raison, la formule explicite puis la gestion de l'inégalité logarithmique.",
    steps:[
      {id:"model",prompt:"Ai-je identifié la nature de la suite et la raison ?",model:"Une hausse de 20 % correspond au coefficient multiplicateur 1+20/100=1,2. Ainsi uₙ₊₁=1,2uₙ : la suite est géométrique, u₀=150.",lesson:"10-suites.md"},
      {id:"formula",prompt:"Ai-je écrit et utilisé la formule explicite sans décaler les indices ?",model:"Pour une suite géométrique de premier terme u₀, uₙ=u₀qⁿ. Ici uₙ=150(1,2)ⁿ et u₂=150×1,44=216.",lesson:"10-suites.md"},
      {id:"threshold",prompt:"Ai-je justifié le seuil avec le logarithme, puis un entier ?",model:"uₙ≥300 ⇔ 1,2ⁿ≥2 ⇔ n≥ln(2)/ln(1,2)≈3,80. Puisque n est entier, n=4 est le premier rang ; u₃=259,2<300 et u₄=311,04≥300.",lesson:"09-exponentielle-logarithme.md"},
      {id:"sum",prompt:"Ai-je montré les termes additionnés et leur somme ?",model:"u₀=150, u₁=180, u₂=216. Par addition, u₀+u₁+u₂=546. On peut aussi utiliser la formule de somme géométrique.",lesson:"10-suites.md"}
    ]},
  "a-probas":{
    intro:"Revois l'indépendance et les conditions de la loi binomiale avant de contrôler les nombres.",
    steps:[
      {id:"experiment",prompt:"Ai-je explicité l'événement « succès » et sa probabilité ?",model:"Le succès est « tirer rouge ». L'urne contient 3 rouges sur 5 boules, donc p=3/5=0,6.",lesson:"12-probabilites.md"},
      {id:"binomial",prompt:"Ai-je justifié les conditions de la loi binomiale ?",model:"Trois tirages, avec remise, sont indépendants et conservent p=0,6. Donc X suit B(3;0,6) et P(X=2)=C(3,2)×0,6²×0,4=0,432.",lesson:"12-probabilites.md"},
      {id:"complement",prompt:"Ai-je utilisé l'événement complémentaire pour « au moins un » ?",model:"P(X≥1)=1−P(X=0)=1−0,4³=0,936. Bien écrire le complément « aucun rouge ».",lesson:"12-probabilites.md"},
      {id:"expectation",prompt:"Ai-je donné la formule de l'espérance et une interprétation ?",model:"Pour X~B(n;p), E(X)=np=3×0,6=1,8 rouge en moyenne sur un grand nombre de répétitions de trois tirages.",lesson:"12-probabilites.md"}
    ]},
  "a-integrales":{
    intro:"Une intégrale et une équation logarithmique demandent des justifications différentes ; vérifie chacune.",
    steps:[
      {id:"primitive",prompt:"Ai-je vérifié ma primitive par dérivation ?",model:"Une primitive de h(x)=4x−2 est H(x)=2x²−2x car H′(x)=4x−2. Toutes les primitives s'obtiennent par H(x)+C.",lesson:"15-primitives-integrales.md"},
      {id:"evaluation",prompt:"Ai-je évalué la primitive aux deux bornes ?",model:"∫₀²(4x−2)dx = [2x²−2x]₀² = (8−4)−0 = 4. Le résultat est signé ; ne pas l'appeler automatiquement « aire ».",lesson:"15-primitives-integrales.md"},
      {id:"domain",prompt:"Ai-je établi le domaine du logarithme avant de résoudre ?",model:"ln(x−1) existe seulement si x−1>0, donc x>1. Une valeur interdite ne doit jamais être retenue.",lesson:"09-exponentielle-logarithme.md"},
      {id:"invert",prompt:"Ai-je justifié l'injectivité du logarithme puis vérifié la solution ?",model:"Pour x>1, ln(x−1)=ln4 donne x−1=4, soit x=5. La condition x>1 est vérifiée.",lesson:"09-exponentielle-logarithme.md"}
    ]},
  "b-fonction":{
    intro:"Les questions sur une fraction rationnelle demandent le domaine, les limites, la dérivée et la justification des asymptotes.",
    steps:[
      {id:"domain",prompt:"Ai-je exclu explicitement les valeurs annulant le dénominateur ?",model:"f(x)=(x²+1)/(x−1) est définie pour x≠1. Le numérateur x²+1>0 sur les réels.",lesson:"05-fonctions.md"},
      {id:"division",prompt:"Ai-je trouvé la décomposition qui facilite l'étude ?",model:"x²+1=(x−1)(x+1)+2, donc f(x)=x+1+2/(x−1) pour x≠1.",lesson:"07-limites-asymptotes.md"},
      {id:"asymptotes",prompt:"Ai-je justifié les asymptotes par leurs limites ?",model:"Quand x→1⁻, 2/(x−1)→−∞, et quand x→1⁺, →+∞ : asymptote verticale x=1. Quand x→±∞, f(x)−(x+1)=2/(x−1)→0 : asymptote oblique y=x+1.",lesson:"07-limites-asymptotes.md"},
      {id:"derivative",prompt:"Ai-je dérivé sur le domaine et interprété la pente ?",model:"Sur x≠1, f′(x)=1−2/(x−1)². En x=3 : f′(3)=1−2/4=0,5, pente de la tangente.",lesson:"06-derivation.md"}
    ]},
  "b-systeme":{
    intro:"Pour un problème concret, la rédaction compte autant que la résolution du système.",
    steps:[
      {id:"unknowns",prompt:"Ai-je posé les inconnues avec leurs unités et leur signification ?",model:"A désigne le prix d'une place adulte en euros et C le prix d'une place enfant en euros ; ces prix sont supposés non négatifs.",lesson:"03-equations-inequations-systemes.md"},
      {id:"equations",prompt:"Ai-je traduit correctement les deux achats par deux équations ?",model:"Un adulte + deux enfants : A+2C=22. Deux adultes + un enfant : 2A+C=29.",lesson:"03-equations-inequations-systemes.md"},
      {id:"solve",prompt:"Ai-je résolu avec une méthode justifiée et vérifié le système ?",model:"Doubler A+2C=22 puis soustraire 2A+C=29 donne 3C=15, donc C=5 et A=12. Vérification : 12+10=22 et 24+5=29.",lesson:"03-equations-inequations-systemes.md"},
      {id:"conclude",prompt:"Ai-je donné les prix et la réponse finale avec unités ?",model:"Place adulte : 12 €. Place enfant : 5 €. Trois adultes et un enfant coûtent 3×12+5=41 €.",lesson:"17-raisonnement-modelisation.md"}
    ]},
  "b-stats":{
    intro:"Prends soin de distinguer moyenne, médiane, variance et étendue.",
    steps:[
      {id:"order",prompt:"Ai-je trié les observations et indiqué l'effectif ?",model:"La série ordonnée est 4,6,6,8,11, effectif N=5. La troisième valeur est la médiane, soit 6.",lesson:"11-statistiques.md"},
      {id:"mean",prompt:"Ai-je calculé la moyenne avec le bon dénominateur ?",model:"Le total des cinq valeurs est 4+6+6+8+11=35 ; comme il y a cinq observations, la moyenne est 35/5=7. On vérifie que 7 est bien comprise entre le minimum 4 et le maximum 11.",lesson:"11-statistiques.md"},
      {id:"variance",prompt:"Ai-je montré les écarts à la moyenne et leur mise au carré ?",model:"Écarts à 7 : −3,−1,−1,1,4. Carrés : 9,1,1,1,16, somme 28. Variance de population =28/5=5,6 (on divise par N, pas par N−1).",lesson:"11-statistiques.md"},
      {id:"spread",prompt:"Ai-je interprété l'étendue et vérifié la cohérence des mesures ?",model:"L'étendue est max−min=11−4=7. La variance est positive et mesure une dispersion quadratique ; elle n'a pas la même unité que la moyenne.",lesson:"11-statistiques.md"}
    ]},
  "b-expo":{
    intro:"La question d'unicité nécessite une vraie preuve, pas seulement un dessin.",
    steps:[
      {id:"continuity",prompt:"Ai-je précisé l'intervalle et justifié la continuité ?",model:"g(x)=eˣ−3 est continue sur ℝ, en particulier sur [0;2]. On a g(0)=−2 et g(2)=e²−3>0.",lesson:"08-continuite-tvi.md"},
      {id:"existence",prompt:"Ai-je appliqué explicitement le TVI pour démontrer l'existence ?",model:"Par continuité sur [0;2] et changement de signe entre les bornes, le théorème des valeurs intermédiaires garantit au moins un zéro dans ]0;2[.",lesson:"08-continuite-tvi.md"},
      {id:"uniqueness",prompt:"Ai-je justifié la stricte monotonie donc l'unicité ?",model:"g′(x)=eˣ>0 partout : g est strictement croissante sur ℝ et n'admet donc pas deux zéros distincts.",lesson:"06-derivation.md"},
      {id:"answer",prompt:"Ai-je résolu, approximé et vérifié la solution ?",model:"g(x)=0 ⇔ eˣ=3 ⇔ x=ln3≈1,098612. Cette valeur appartient à ]0;2[.",lesson:"09-exponentielle-logarithme.md"}
    ]}
};
export const getRubric=id=>RUBRICS[id]||null;
export function validateRubrics(exams){
  const problems=[];
  const ids=new Set();
  const sections=exams.flatMap(e=>e.sections);
  const validPaths=/^\d{2}-[a-z0-9-]+\.md$/;
  const required=new Set(sections.map(s=>s.id));
  for(const section of sections){
    const rubric=getRubric(section.id);
    if(!rubric||rubric.steps.length<3||rubric.steps.length>6) {
      problems.push("Rubrique manquante ou taille incorrecte : "+section.id);continue;
    }
    if(!rubric.intro||rubric.intro.length<25)problems.push("Introduction insuffisante : "+section.id);
    for(const step of rubric.steps){
      const combined=section.id+":"+step.id;
      if(ids.has(combined))problems.push("Étape dupliquée : "+combined);
      ids.add(combined);
      if(!step.prompt||step.prompt.length<25||!step.model||step.model.length<45||!validPaths.test(step.lesson||""))
        problems.push("Étape pédagogique incomplète : "+combined);
    }
  }
  for(const id of Object.keys(RUBRICS))if(!required.has(id))problems.push("Rubrique orpheline : "+id);
  return problems;
}
export function validReviewKeys(exam){
  return new Set(exam.sections.flatMap(s=>(getRubric(s.id)?.steps||[]).map(step=>s.id+":"+step.id)));
}
export function sanitizeSelfChecks(raw,exam){
  const valid=validReviewKeys(exam);
  const clean={};
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return clean;
  for(const [key,value] of Object.entries(raw))if(valid.has(key)&&value===true)clean[key]=true;
  return clean;
}
export function countChecks(result){
  const examId=result?.examId;
  let total=0,checked=0;
  for(const [sectionId,rubric] of Object.entries(RUBRICS)){
    if(!sectionId.startsWith(examId==="blanc-1"?"a-":"b-"))continue;
    for(const step of rubric.steps){
      total++;
      if(result.selfChecks?.[sectionId+":"+step.id]===true)checked++;
    }
  }
  return {checked,total};
}
