// Materialize the Android-approved character trial as immutable, versioned PNGs.
// Originals remain in npc-v1 and npc-ria-v3; no render-time pixel conversion.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {blank,decodePNG,encodePNG} from './lib/png.mjs';

const cell=96,output='assets/player/character-baseline-v2';
const check=process.argv.includes('--check');
if(!check)fs.mkdirSync(output,{recursive:true});
const write=(file,image)=>{
  const bytes=encodePNG(image);
  if(check)assert(fs.readFileSync(file).equals(bytes),`Non-reproducible approved sprite: ${file}`);
  else fs.writeFileSync(file,bytes);
};
for(const pose of ['walk','chop','fish']){
  const body=decodePNG(fs.readFileSync(`assets/player/npc-v1/${pose}-body.png`));
  const fitted={width:body.width,height:body.height,data:Buffer.from(body.data)};
  for(let frame=0;frame<body.width/cell;frame++)for(let y=57;y<=59;y++)for(let x=45;x<=51;x++){
    const p=(y*body.width+frame*cell+x)*4,shirt=(62*body.width+frame*cell+x)*4;
    const [r,g,b,a]=body.data.subarray(p,p+4);
    if(a>=128&&r>150&&r>g*1.1&&g>b*1.05&&body.data[shirt+3]>=128)
      body.data.copy(fitted.data,p,shirt,shirt+3);
  }
  write(`${output}/${pose}-body.png`,fitted);
  for(const part of ['head','hair']){
    const source=decodePNG(fs.readFileSync(`assets/player/npc-ria-v3/${pose}-${part}.png`));
    const target=blank(source.width,source.height),offsets=[2,-2,2,0];
    for(let row=0;row<4;row++)for(let frame=0;frame<source.width/cell;frame++)
      for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
        const shifted=x+offsets[row];if(shifted<0||shifted>=cell)continue;
        const from=((row*cell+y)*source.width+frame*cell+x)*4;
        const to=((row*cell+y)*target.width+frame*cell+shifted)*4;
        source.data.copy(target.data,to,from,from+4);
      }
    if(part==='hair')for(let frame=0;frame<source.width/cell;frame++)
      for(const [row,left,right,peaks] of [[1,45,52,[48,49]],[2,47,53,[50,51]]]){
        const at=(x,y)=>((row*cell+y)*target.width+frame*cell+x)*4;
        for(const x of [left,right])target.data.fill(0,at(x,27),at(x,27)+4);
        const sample=Buffer.from(target.data.subarray(at(peaks[0],27),at(peaks[0],27)+4));
        for(const x of peaks)sample.copy(target.data,at(x,26));
      }
    write(`${output}/${pose}-${part}.png`,target);
  }
}
console.log(`${check?'Verified':'Packed'} 9 approved character baseline atlases in ${output}`);
