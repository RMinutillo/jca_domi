const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.txt':'text/plain'};
const args=process.argv.slice(2);const portIndex=args.indexOf('--port');
const port=Number(portIndex>=0?args[portIndex+1]:process.env.PORT||4173);
http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const requested=name.endsWith('/')?name+'index.html':name;const file=path.resolve(root,'.'+requested);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});}).listen(port,'0.0.0.0',()=>console.log('JCA preview ready on '+port));
