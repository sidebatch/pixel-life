import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((request, response) => {
  const requestedPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404).end('Not found');
    return;
  }

  const type=mimeTypes[path.extname(filePath)]||'application/octet-stream';
  const size=fs.statSync(filePath).size;
  // HTML audio can request the tail for metadata, seek, and native looping.
  if(path.extname(filePath)==='.mp3'&&request.headers.range){
    const range=/^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    let start=range?.[1]?Number(range[1]):0,end=range?.[2]?Number(range[2]):size-1;
    if(range&&!range[1]&&range[2]){start=Math.max(0,size-Number(range[2]));end=size-1;}
    end=Math.min(size-1,end);
    if(!range||!range[1]&&!range[2]||start>end||start>=size){response.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
    response.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes',
      'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
    fs.createReadStream(filePath,{start,end}).pipe(response);return;
  }
  response.writeHead(200, { 'Content-Type':type,'Content-Length':size,
    'Accept-Ranges':path.extname(filePath)==='.mp3'?'bytes':'none' });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Pixel Life is running at http://127.0.0.1:${port}`);
  if (host !== '127.0.0.1') console.log(`Android on the same Wi-Fi: http://<PC-IP>:${port}/?weather-preview`);
});
