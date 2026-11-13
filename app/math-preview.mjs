/**
 * Mise en page MathML sûre pour le cahier : aucun HTML utilisateur, aucune
 * exécution, aucun réseau. Il s'agit d'un aperçu, PAS d'un correcteur.
 * Un énoncé trop complexe reste affiché tel qu'il a été saisi.
 */
import {parsePolynomial} from "./quadratic-checker.mjs";

const MATH_NS="http://www.w3.org/1998/Math/MathML";
const MAX_LINES=24,MAX_LINE_LENGTH=180,MAX_TOKENS=100,MAX_DEPTH=22;
const RELATIONS=new Set(["=","<",">","≤","≥","≠"]);
const PRIMARY=new Set(["number","name","(","[","√","π"]);
const OP=/[π√²=+\-−×·÷/^()[\]<>≤≥≠]/u;
const NUMBER=/^\d+(?:[.,]\d+)?/u;
const NAME=/^[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ_0-9]*/u;
function tokenize(text){
  if(typeof text!=="string"||text.length>MAX_LINE_LENGTH)throw Error("ligne trop longue");
  const out=[];let pos=0;
  while(pos<text.length){
    const tail=text.slice(pos);
    if(/^\s/u.test(tail)){pos++;continue;}
    const number=tail.match(NUMBER),name=tail.match(NAME);
    if(number){out.push({type:"number",value:number[0]});pos+=number[0].length;}
    else if(name){out.push({type:"name",value:name[0]});pos+=name[0].length;}
    else if(OP.test(text[pos])){out.push({type:text[pos],value:text[pos]});pos++;}
    else throw Error("symbole non interprété");
    if(out.length>MAX_TOKENS)throw Error("trop de symboles");
  }
  return out;
}
export function parseMathLine(line){
  try{
    const definition=typeof line==="string"&&line.length<=MAX_LINE_LENGTH?
      line.match(/^\s*([fgh])\s*(['’′])?\s*\(\s*x\s*\)\s*=\s*(.+?)\s*$/u):null;
    if(definition){
      // Ne jamais représenter sin(x), 1/x ou des expressions de degré > 2
      // comme une multiplication implicite f(x) : valider le polynôme d'abord.
      try{parsePolynomial(definition[3]);}
      catch{return null;}
      const expression=parseMathLine(definition[3]);
      return expression?{type:"functionDefinition",name:definition[1],prime:!!definition[2],expression}:null;
    }
    const tokens=tokenize(line),end=tokens.length;
    if(!end)return null;
    let i=0,depth=0;
    const peek=()=>tokens[i]?.type;
    const take=type=>{
      if(peek()!==type)throw Error("syntaxe mathématique incomplète");
      return tokens[i++].value;
    };
    function nested(fn){
      if(++depth>MAX_DEPTH)throw Error("expression trop imbriquée");
      try{return fn();}finally{depth--;}
    }
    function primary(){
      const t=peek();
      if(t==="number"){const value=take(t);return {type:"number",value};}
      if(t==="name"){const value=take(t);return {type:"name",value};}
      if(t==="π"){take(t);return {type:"name",value:"π"};}
      if(t==="√"){
        take(t);
        const arg=tokens[i]?.type==="("||tokens[i]?.type==="["?primary():power();
        return {type:"sqrt",arg};
      }
      if(t==="("||t==="["){
        take(t);
        const body=nested(sum),close=t==="("?")":"]";
        take(close);
        return {type:"group",open:t,close,body};
      }
      throw Error("expression incomplète");
    }
    function power(){
      let base=primary();
      while(peek()==="²"||peek()==="^"){
        if(peek()==="²"){take("²");base={type:"power",base,exponent:{type:"number",value:"2"}};}
        else{take("^");const exponent=nested(unary);base={type:"power",base,exponent};}
      }
      return base;
    }
    function unary(){
      const t=peek();
      if(t==="+"||t==="-"||t==="−"){
        take(t);return {type:"unary",op:t==="+"?"+":"−",arg:nested(unary)};
      }
      return power();
    }
    function product(){
      let left=unary();
      for(;;){
        const t=peek();
        if(["/","÷","×","·"].includes(t)){
          take(t);
          const right=unary();
          left={type:t==="/"||t==="÷"?"fraction":"binary",op:t,left,right};
        }else if(PRIMARY.has(t)){
          const right=unary();
          left={type:"binary",op:"implicit",left,right};
        }else break;
      }
      return left;
    }
    function sum(){
      let left=product();
      while(["+","-","−"].includes(peek())){
        const op=take(peek());
        left={type:"binary",op:op==="-"?"−":op,left,right:product()};
      }
      return left;
    }
    const left=sum();
    let ast=left;
    if(RELATIONS.has(peek())){
      const op=take(peek());
      ast={type:"binary",op,left,right:sum()};
    }
    if(i!==end)throw Error("symboles supplémentaires");
    return ast;
  }catch{return null;}
}
function node(doc,tag,contents){
  const element=doc.createElementNS(MATH_NS,tag);
  if(contents!==undefined)element.textContent=contents;
  return element;
}
export function mathNode(doc,ast){
  if(!ast||typeof ast!=="object")throw Error("Formule invalide");
  if(ast.type==="functionDefinition"){
    const row=node(doc,"mrow");
    if(ast.prime){
      const name=node(doc,"msup");
      name.append(node(doc,"mi",ast.name),node(doc,"mo","′"));
      row.append(name);
    }else row.append(node(doc,"mi",ast.name));
    row.append(node(doc,"mo","("),node(doc,"mi","x"),node(doc,"mo",")"),node(doc,"mo","="),mathNode(doc,ast.expression));
    return row;
  }
  if(ast.type==="number")return node(doc,"mn",ast.value);
  if(ast.type==="name")return node(doc,"mi",ast.value);
  if(ast.type==="power"){
    const out=node(doc,"msup");out.append(mathNode(doc,ast.base),mathNode(doc,ast.exponent));return out;
  }
  if(ast.type==="sqrt"){
    const out=node(doc,"msqrt");out.append(mathNode(doc,ast.arg));return out;
  }
  if(ast.type==="fraction"){
    const out=node(doc,"mfrac");out.append(mathNode(doc,ast.left),mathNode(doc,ast.right));return out;
  }
  if(ast.type==="group"){
    const out=node(doc,"mrow");
    out.append(node(doc,"mo",ast.open),mathNode(doc,ast.body),node(doc,"mo",ast.close));return out;
  }
  if(ast.type==="unary"){
    const out=node(doc,"mrow");
    out.append(node(doc,"mo",ast.op),mathNode(doc,ast.arg));return out;
  }
  if(ast.type==="binary"){
    const out=node(doc,"mrow");out.append(mathNode(doc,ast.left));
    if(ast.op!=="implicit")out.append(node(doc,"mo",ast.op==="−"?"−":ast.op));
    out.append(mathNode(doc,ast.right));return out;
  }
  throw Error("Expression non reconnue");
}
export function renderMathPreview(container,text){
  if(!container?.ownerDocument)throw Error("Cible de prévisualisation invalide");
  const doc=container.ownerDocument,frag=doc.createDocumentFragment();
  const lines=String(text??"").split(/\r?\n/),visible=lines.slice(0,MAX_LINES);
  let rendered=0,raw=0;
  for(let i=0;i<visible.length;i++){
    const line=visible[i].trim();if(!line)continue;
    const row=doc.createElement("div");row.className="math-preview-line";
    const number=doc.createElement("span");number.className="math-preview-number";number.textContent=String(i+1);
    row.append(number);
    const ast=parseMathLine(line);
    if(ast){
      const math=node(doc,"math");math.setAttribute("display","block");
      math.setAttribute("aria-label",line);
      math.append(mathNode(doc,ast));row.append(math);rendered++;
    }else{
      const fallback=doc.createElement("span");fallback.className="math-preview-plain";
      fallback.textContent=line.slice(0,MAX_LINE_LENGTH);
      row.append(fallback);raw++;
    }
    frag.append(row);
  }
  if(lines.length>MAX_LINES){
    const note=doc.createElement("p");note.className="helper";
    note.textContent="Aperçu limité aux 24 premières lignes ; le cahier complet reste enregistré.";
    frag.append(note);
  }
  if(!rendered&&!raw){
    const note=doc.createElement("p");note.className="helper";
    note.textContent="Écris une formule ci-dessus pour voir son aperçu mis en page.";
    frag.append(note);
  }
  container.replaceChildren(frag);
  return {rendered,raw,truncated:lines.length>MAX_LINES};
}
