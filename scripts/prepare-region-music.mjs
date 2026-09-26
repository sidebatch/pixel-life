// User WAV originals stay outside the repository; create compact streaming BGM.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const source=path.resolve(process.argv[2]||'..');
const ffmpeg=process.env.PIXEL_LIFE_FFMPEG||'ffmpeg';
const tracks={meadow:'Meadow-Reverie',woodland:'Woodland-Wander',lakeside:'Lakeside-Reverie'};
fs.mkdirSync('assets/audio/music',{recursive:true});
for(const [id,name] of Object.entries(tracks)){
  const input=path.join(source,`${name}-mixdown-00-00_06-00-1x.wav`);
  if(!fs.existsSync(input))throw new Error(`Missing user music: ${input}`);
  const output=`assets/audio/music/${id}.mp3`;
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-n','-i',input,'-vn',
    '-af','loudnorm=I=-18:TP=-2:LRA=11','-ar','44100','-ac','2',
    '-c:a','libmp3lame','-b:a','128k','-map_metadata','-1','-write_xing','1',output],{stdio:'inherit'});
  console.log(`${id}: ${fs.statSync(output).size.toLocaleString()} bytes (original preserved)`);
}
