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
function installMath(target,equations){
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT),found=[];
  while(walker.nextNode())if(walker.currentNode.nodeValue.includes("DAEUMATHTOKEN"))found.push(walker.currentNode);
  const regex=/DAEUMATHTOKEN(\d+)END/g;
  for(const node of found){
    const fragment=document.createDocumentFragment(),source=node.nodeValue;
    let from=0;
    for(const match of source.matchAll(regex)){
      fragment.append(document.createTextNode(source.slice(from,match.index)));
      const item=equations[Number(match[1])];
      if(!item){fragment.append(document.createTextNode(match[0]));continue;}
      const span=document.createElement("span");
      span.className=item.block?"course-math-block":"course-math-inline";
      span.setAttribute("aria-label",item.tex);
      try{
        const rendered=temml.renderToString(item.tex,{displayMode:item.block,throwOnError:true,trust:false});
        const clean=DOMPurify.sanitize(rendered,{USE_PROFILES:{mathMl:true}});
        if(!clean.includes("<math"))throw Error("Rendu MathML vide");
        span.innerHTML=clean;
      }catch(error){
        span.classList.add("course-math-fallback");span.textContent=item.tex;
      }
      fragment.append(span);
      from=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(source.slice(from)));
    node.replaceWith(fragment);
  }
}
export function renderMathMarkdown(target,source,markdown=new showdown.Converter()){
  const {cleaned,equations}=separateMath(source);
  target.innerHTML=DOMPurify.sanitize(markdown.makeHtml(cleaned),{
    FORBID_TAGS:["script","style","iframe","object","embed","form","img"],
    FORBID_ATTR:["style","srcdoc","onerror","onclick","onload"]
  });
  installMath(target,equations);
}
