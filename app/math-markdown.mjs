const formulaObservers=new WeakMap();

function separateMath(src){
  const equations=[];
  const cleaned=src.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<!\\)\$([^$\n]+?)\$/g,
    (match,dollars,brackets,inlineBrackets,inlineDollars)=>{
      const tex=dollars??brackets??inlineBrackets??inlineDollars;
      const block=dollars!==undefined||brackets!==undefined;
      const placeholder="DAEUMATHTOKEN"+equations.length+"END";
      equations.push({tex,block});
      return (block?"\n\n":"")+placeholder+(block?"\n\n":"");
    });
  return {cleaned,equations};
}
function installMath(target,equations,typeset){
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT),found=[];
  while(walker.nextNode())if(walker.currentNode.nodeValue.includes("DAEUMATHTOKEN"))found.push(walker.currentNode);
  const regex=/DAEUMATHTOKEN(\d+)END/g;
  const formulas=[];
  for(const node of found){
    const fragment=document.createDocumentFragment(),source=node.nodeValue;
    let from=0;
    for(const match of source.matchAll(regex)){
      fragment.append(document.createTextNode(source.slice(from,match.index)));
      from=match.index+match[0].length;
      const item=equations[Number(match[1])];
      if(!item){fragment.append(document.createTextNode(match[0]));continue;}
      if(!typeset){fragment.append(document.createTextNode(item.tex));continue;}
      const span=document.createElement("span");
      span.className=item.block?"course-math-block":"course-math-inline";
      try{
        const rendered=temml.renderToString(item.tex,{displayMode:item.block,throwOnError:true,trust:false});
        const clean=DOMPurify.sanitize(rendered,{USE_PROFILES:{mathMl:true}});
        if(!clean.includes("<math"))throw Error("Rendu MathML vide");
        span.innerHTML=clean;
        formulas.push(span);
      }catch{
        span.classList.add("course-math-fallback");span.textContent=item.tex;
      }
      fragment.append(span);
    }
    fragment.append(document.createTextNode(source.slice(from)));
    node.replaceWith(fragment);
  }
  return formulas;
}

function watchFormulaOverflow(target,formulas){
  formulaObservers.get(target)?.disconnect();
  if(!formulas.length)return;
  function update(){
    const overflowByFormula=formulas.map(formula=>formula.scrollWidth>formula.clientWidth+1);
    for(const [index,formula] of formulas.entries()){
      const overflow=overflowByFormula[index];
      if(overflow===formula.hasAttribute("tabindex"))continue;
      if(overflow){
        formula.tabIndex=0;
        formula.setAttribute("role","group");
        formula.setAttribute("aria-label","Formule défilable horizontalement");
      }else{
        formula.removeAttribute("tabindex");
        formula.removeAttribute("role");
        formula.removeAttribute("aria-label");
      }
    }
  }
  update();
  if(typeof ResizeObserver!=="function")return;
  const observer=new ResizeObserver(update);
  observer.observe(target);
  formulaObservers.set(target,observer);
}
export function renderMathMarkdown(target,source,markdown=new showdown.Converter(),{typeset=true}={}){
  const {cleaned,equations}=separateMath(source);
  target.innerHTML=DOMPurify.sanitize(markdown.makeHtml(cleaned),{
    FORBID_TAGS:["script","style","iframe","object","embed","form","img"],
    FORBID_ATTR:["style","srcdoc","onerror","onclick","onload"]
  });
  watchFormulaOverflow(target,installMath(target,equations,typeset));
}
