// Small, dependency-free PNG helper for deterministic sprite packing and checks.
import {inflateSync,deflateSync} from 'node:zlib';
export function blank(width,height){return {width,height,data:Buffer.alloc(width*height*4)};}
const crcTable=Array.from({length:256},(_,n)=>{
  for(let k=0;k<8;k++) n=n&1?0xedb88320^(n>>>1):n>>>1;
  return n>>>0;
});
function crc32(data){let crc=0xffffffff;for(const n of data)crc=crcTable[(crc^n)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function chunk(type,data){
  const name=Buffer.from(type),out=Buffer.alloc(data.length+12);
  out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([name,data])),data.length+8);return out;
}
export function encodePNG(image){
  const header=Buffer.alloc(13);header.writeUInt32BE(image.width);header.writeUInt32BE(image.height,4);
  header[8]=8;header[9]=6;
  const raw=Buffer.alloc((image.width*4+1)*image.height);
  for(let y=0;y<image.height;y++)image.data.copy(raw,y*(image.width*4+1)+1,y*image.width*4,(y+1)*image.width*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
export function decodePNG(bytes){
  let width,height,type,depth,interlace,palette,transparency;const compressed=[];
  for(let at=8;at<bytes.length;){
    const length=bytes.readUInt32BE(at),name=bytes.toString('ascii',at+4,at+8),data=bytes.subarray(at+8,at+8+length);
    if(name==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];interlace=data[12];}
    if(name==='IDAT')compressed.push(data);
    if(name==='PLTE')palette=data;
    if(name==='tRNS')transparency=data;
    at+=length+12;
  }
  if(depth!==8||interlace!==0||![2,3,6].includes(type))throw new Error('Expected non-interlaced 8-bit RGB/palette/RGBA PNG');
  const channels=type===6?4:type===2?3:1,stride=width*channels,raw=inflateSync(Buffer.concat(compressed)),scan=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];
    for(let x=0;x<stride;x++){
      const i=y*stride+x,a=x>=channels?scan[i-channels]:0,b=y?scan[i-stride]:0,c=y&&x>=channels?scan[i-stride-channels]:0;
      const predict=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):NaN;
      if(!Number.isFinite(predict))throw new Error('Unknown PNG filter');
      scan[i]=(raw[y*(stride+1)+1+x]+predict)&255;
    }
  }
  const image=blank(width,height);
  for(let p=0;p<width*height;p++){
    const i=p*4,s=p*channels;
    if(type===3){const n=scan[s];palette.copy(image.data,i,n*3,n*3+3);image.data[i+3]=transparency?.[n]??255;}
    else{scan.copy(image.data,i,s,s+3);image.data[i+3]=channels===4?scan[s+3]:255;}
  }
  return image;
}
export function crop(image,x,y,width,height){
  const out=blank(width,height);
  for(let row=0;row<height;row++)image.data.copy(out.data,row*width*4,((row+y)*image.width+x)*4,((row+y)*image.width+x+width)*4);
  return out;
}
export function alphaBounds(image){
  let x0=image.width,y0=image.height,x1=-1,y1=-1;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(image.data[(y*image.width+x)*4+3]>=128){
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
  }
  if(x1<0)throw new Error('Empty sprite frame');
  return {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};
}
export function mainSpriteBounds(image){
  // Generated equal-grid sheets can spill a few feet pixels across a row edge.
  // Select the main connected sprite instead of stretching those stray pixels.
  const visited=new Uint8Array(image.width*image.height);let best=[];
  for(let start=0;start<visited.length;start++){
    if(visited[start]||image.data[start*4+3]<128)continue;
    const queue=[start];visited[start]=1;
    for(let q=0;q<queue.length;q++){
      const n=queue[q],x=n%image.width,y=Math.floor(n/image.width);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=image.width||yy>=image.height)continue;
        const next=yy*image.width+xx;
        if(!visited[next]&&image.data[next*4+3]>=128){visited[next]=1;queue.push(next);}
      }
    }
    if(queue.length>best.length)best=queue;
  }
  if(!best.length)throw new Error('Empty generated frame');
  let x0=image.width,y0=image.height,x1=0,y1=0;
  for(const n of best){const x=n%image.width,y=Math.floor(n/image.width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  return {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};
}
export function blitNearest(target,source,dx,dy,width=source.width,height=source.height){
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const tx=x+dx,ty=y+dy;if(tx<0||ty<0||tx>=target.width||ty>=target.height)continue;
    const s=(Math.min(source.height-1,Math.floor(y*source.height/height))*source.width+Math.min(source.width-1,Math.floor(x*source.width/width)))*4;
    if(source.data[s+3]<128)continue;
    source.data.copy(target.data,(ty*target.width+tx)*4,s,s+3);target.data[(ty*target.width+tx)*4+3]=255;
  }
}
