// Pack the generated foredeck into the exact bow projection; alpha is preserved.
import fs from 'node:fs';
import {alphaBounds,blank,blitNearest,crop,decodePNG,encodePNG} from './lib/png.mjs';
const source=decodePNG(fs.readFileSync('assets/voyage/source/voyage-bow-v1.png')),bounds=alphaBounds(source);
if(!bounds.width||!bounds.height)throw Error('Empty bow source');
const trimmed=crop(source,bounds.x,bounds.y,bounds.width,bounds.height),out=blank(168,336);
blitNearest(out,trimmed,2,2,164,332);
fs.writeFileSync('assets/voyage/voyage-bow-v1.png',encodePNG(out));
console.log('voyage-bow-v1 168x336, alpha trim and nearest-neighbor footprint packing');
