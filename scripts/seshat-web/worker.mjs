// Seshat est distribué séparément sous GPLv3. Voir compatibility.patch et build.sh.
import createSeshat from "./seshat.mjs";

let enginePromise;
const output=[];
const errors=[];

self.addEventListener("message",async ({data:strokes})=>{
  try{
    output.length=0;
    errors.length=0;
    const started=performance.now();
    enginePromise??=createSeshat({print:line=>output.push(line),printErr:line=>errors.push(line)});
    const engine=await enginePromise;
    const loaded=performance.now();
    const lines=["SCG_INK",strokes.length];
    for(const stroke of strokes){
      lines.push(stroke.length,...stroke.map(([x,y])=>`${x} ${y}`));
    }
    engine.FS.writeFile("/input.scgink",lines.join("\n")+"\n");
    const exitCode=engine.callMain(["-c","/Config/CONFIG","-i","/input.scgink"]);
    const marker=output.indexOf("LaTeX:");
    if(exitCode||marker===-1)throw Error(errors.join(" ")||output.at(-1)||"Aucune sortie LaTeX");
    self.postMessage({latex:output[marker+1]||null,loadMs:loaded-started,totalMs:performance.now()-started});
  }catch(error){
    self.postMessage({error:String(error)});
  }
});
