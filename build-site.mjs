import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const files={
  "/":{body:read("index.html"),type:"text/html; charset=utf-8"},
  "/index.html":{body:read("index.html"),type:"text/html; charset=utf-8"},
  "/styles.css":{body:read("styles.css"),type:"text/css; charset=utf-8"},
  "/rules.js":{body:read("rules.js"),type:"text/javascript; charset=utf-8"},
  "/app.js":{body:read("app.js"),type:"text/javascript; charset=utf-8"},
  "/manifest.webmanifest":{body:read("manifest.webmanifest"),type:"application/manifest+json; charset=utf-8"},
  "/icon.svg":{body:read("icon.svg"),type:"image/svg+xml; charset=utf-8"},
  "/model-data.js":{body:read("model-data.js"),type:"text/javascript; charset=utf-8"},
  "/lawd-map.js":{body:read("lawd-map.js"),type:"text/javascript; charset=utf-8"}
};
const worker=`const FILES=${JSON.stringify(files)};\nexport default {async fetch(request){const url=new URL(request.url);const file=FILES[url.pathname];if(!file)return new Response("Not found",{status:404});return new Response(file.body,{headers:{"content-type":file.type,"cache-control":"no-store","x-content-type-options":"nosniff"}})}};\n`;
const out=path.join(root,"dist","server");
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,"index.js"),worker,"utf8");
console.log(`Built ${Object.keys(files).length} routes into dist/server/index.js`);