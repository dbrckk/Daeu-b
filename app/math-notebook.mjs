/**
 * Cahier de calcul numérique accessible au clavier et au tactile.
 * Les calculs sont des lignes de rédaction libres, jamais évaluées comme preuve.
 * Chaque contexte a son brouillon. Aucun eval ni interprétation de code.
 */
const SYMBOLS=["+","−","×","÷","=","(",")","²","√","π","≤","≥","≠","→","^","/"];
const LIMIT=12000;
export function notebookKey(context){
  if(typeof context!=="string"||!/^[-\w:.]{1,120}$/.test(context))throw new Error("Identifiant de brouillon invalide");
  return "daeu-b-notebook-v1:"+context;
}
export function insertAtSelection(value,symbol,start,end){
  const text=String(value).slice(0,LIMIT);
  const a=Math.max(0,Math.min(text.length,Number(start)||0));
  const b=Math.max(a,Math.min(text.length,Number(end)||a));
  const addition=String(symbol).slice(0,LIMIT);
  const result=(text.slice(0,a)+addition+text.slice(b)).slice(0,LIMIT);
  return {value:result,caret:Math.min(result.length,a+addition.length)};
}
export function mountNotebook(host,{context,storage=globalThis.localStorage,title="Mon cahier de calcul"}){
  if(!host)throw new Error("Emplacement de cahier absent");
  const key=notebookKey(context);
  const section=document.createElement("section");
  section.className="math-notebook";
  const heading=document.createElement("h4");heading.textContent=title;
  const help=document.createElement("p");help.className="helper";
  help.textContent="Écris toutes les étapes ici comme sur une copie : égalités, fractions, équations, justification et conclusion. Le brouillon est sauvegardé à chaque modification ; il n'est pas corrigé automatiquement.";
  const field=document.createElement("textarea");
  field.className="math-notebook-editor";field.rows=9;field.maxLength=LIMIT;field.spellcheck=false;
  field.setAttribute("aria-label",title+" — rédaction mathématique");
  field.placeholder="Exemple :\n2x + 5 = 17\n2x = 17 − 5\n2x = 12\nx = 6\nVérification : 2 × 6 + 5 = 17";
  const keypad=document.createElement("div");keypad.className="math-notebook-keypad";keypad.setAttribute("role","group");keypad.setAttribute("aria-label","Symboles mathématiques");
  const status=document.createElement("p");status.className="helper";status.setAttribute("role","status");
  let initial="";
  try{initial=storage.getItem(key)||"";}catch{status.textContent="Stockage indisponible : le brouillon ne sera pas conservé.";}
  field.value=initial.slice(0,LIMIT);
  const save=()=>{
    try{storage.setItem(key,field.value);status.textContent="Brouillon enregistré sur cet appareil.";}
    catch{status.textContent="Enregistrement impossible : ne ferme pas cette page avant d'avoir copié ton texte.";}
  };
  field.addEventListener("input",save);
  for(const symbol of SYMBOLS){
    const button=document.createElement("button");button.type="button";button.className="subtle small";button.textContent=symbol;button.setAttribute("aria-label","Insérer "+symbol);
    button.addEventListener("click",()=>{
      const next=insertAtSelection(field.value,symbol,field.selectionStart,field.selectionEnd);
      field.value=next.value;field.focus();field.setSelectionRange(next.caret,next.caret);save();
    });
    keypad.append(button);
  }
  const addLine=document.createElement("button");addLine.type="button";addLine.className="subtle small";addLine.textContent="Nouvelle ligne";
  addLine.addEventListener("click",()=>{
    const next=insertAtSelection(field.value,"\n",field.selectionStart,field.selectionEnd);
    field.value=next.value;field.focus();field.setSelectionRange(next.caret,next.caret);save();
  });keypad.append(addLine);
  section.append(heading,help,keypad,field,status);
  host.replaceChildren(section);
  return {element:section,field,save};
}
