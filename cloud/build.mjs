import {build} from "esbuild";
await build({entryPoints:["browser-client.mjs"],bundle:true,format:"esm",target:"es2022",outfile:"../browser/cloud.bundle.js",minify:true,legalComments:"eof"});
