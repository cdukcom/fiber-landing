import { cableImportReference } from './js/cable-reference.js'
import { publicFile, securityHeadersFor } from './web-security.mjs';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { Pool } from "pg";

const root = process.cwd();
const applySecurityHeaders = securityHeadersFor(root);
const port = Number(process.env.PORT || 8766);
const production = process.env.NODE_ENV === "production";
const secret = process.env.VERIFY_SECRET || "local-fiber-development-secret";
const adminUser = process.env.ADMIN_USER || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin";
const pool = process.env.DATABASE_URL ? new Pool({connectionString:process.env.DATABASE_URL,ssl:production?{rejectUnauthorized:false}:false}) : null;
const attempts = new Map();
const allowedEvents = new Set(["page_view","line_view","selector_open","selector_change","reference_view","outbound_tool","whatsapp_click","email_click","datasheet_download","configuration_complete","configuration_url_copied"]);
const mime = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".pdf":"application/pdf",".txt":"text/plain; charset=utf-8",".xml":"application/xml; charset=utf-8",".ico":"image/x-icon"};
const patchcordRoutes = JSON.parse(await readFile(join(root,"data/patchcord-routes.json"),"utf8"));
const routeMap = new Map(patchcordRoutes.map(item => [item.path,item]));
const cableRoutes = JSON.parse(await readFile(join(root,"data/cable-routes.json"),"utf8"));
const cableRouteMap = new Map(cableRoutes.map(item => [item.path,item]));
const pdfLogo = await readFile(join(root,"img/logos/fiber-pdf.jpg"));
const validLengths = new Set([1,2,3,5,10,15,20,25,40,50,80,100]);
function parsePatchcordPath(pathname) {
  if (routeMap.has(pathname)) return routeMap.get(pathname);
  const match=pathname.match(/^\/patch-cords\/(multimodo|monomodo)\/(om2|om3|om4|os2)\/(duplex|simplex)\/(lc|sc|st|fc)-(lc|sc|st|fc)-(\d+)m\/$/i);
  if(!match) return null;
  const [,familySlug,subtype,mode,connA,connB,lengthRaw]=match,length=Number(lengthRaw);
  if(!validLengths.has(length)||(familySlug==="multimodo"&&subtype.toLowerCase()==="os2")||(familySlug==="monomodo"&&subtype.toLowerCase()!=="os2")) return null;
  return {path:pathname,family:familySlug==="multimodo"?"MM":"SM",subtype:subtype.toUpperCase(),mode:mode[0].toUpperCase()+mode.slice(1).toLowerCase(),connA:connA.toUpperCase(),connB:connB.toUpperCase(),length};
}
function parseCablePath(pathname) { return cableRouteMap.get(pathname) || null; }

if (production && (!process.env.VERIFY_SECRET || !process.env.ADMIN_PASSWORD)) throw new Error("VERIFY_SECRET and ADMIN_PASSWORD are required in production");
if (pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS fiber_events (
    id BIGSERIAL PRIMARY KEY,event_type TEXT NOT NULL,path TEXT,line TEXT,reference TEXT,
    session_id TEXT,source TEXT,metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS fiber_events_created_idx ON fiber_events(created_at DESC);
    CREATE INDEX IF NOT EXISTS fiber_events_type_created_idx ON fiber_events(event_type,created_at DESC);`);
}

function json(res,status,value,headers={}) { res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...headers}); res.end(JSON.stringify(value)); }
async function body(req) { let raw=""; for await (const chunk of req) { raw+=chunk; if(raw.length>30000) throw new Error("Body too large"); } return raw?JSON.parse(raw):{}; }
function cookies(req) { return Object.fromEntries(String(req.headers.cookie||"").split(";").map(x=>x.trim().split(/=(.*)/s).slice(0,2).map(decodeURIComponent)).filter(([k])=>k)); }
function sign(value) { const payload=Buffer.from(JSON.stringify(value)).toString("base64url"); return `${payload}.${createHmac("sha256",secret).update(payload).digest("base64url")}`; }
function adminSession(req) { try { const [payload,supplied]=String(cookies(req).fiber_admin||"").split("."); const expected=createHmac("sha256",secret).update(payload||"").digest("base64url"); if(!supplied||supplied.length!==expected.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(expected))) return null; const value=JSON.parse(Buffer.from(payload,"base64url")); return value.exp>Date.now()?value:null; } catch{return null;} }
function validPassword(value) { const salt="fiber-admin"; return timingSafeEqual(scryptSync(String(value),salt,64),scryptSync(adminPassword,salt,64)); }
function sameOrigin(req) { const origin=req.headers.origin; return !origin||origin===`${req.headers["x-forwarded-proto"]||"http"}://${req.headers.host}`; }
function clean(value,max=200) { return String(value||"").trim().slice(0,max); }
function sourceGroup(value) { const source=String(value||"direct").toLowerCase(); if(!source||source==="direct"||source==="(direct)")return "Directo"; if(["google","bing","yahoo","duckduckgo"].some(x=>source.includes(x)))return "Buscadores"; if(["facebook","instagram","linkedin","youtube","tiktok","x.com","twitter"].some(x=>source.includes(x)))return "Redes sociales"; return "Referidos / campañas"; }
function titleFor(item) { if(!item) return "Fiber Electronics | Fibra óptica, SFP y conectividad"; if(item.slug) return `${cableImportReference(item)} · Cable ${item.family==='SM'?'Monomodo':'Multimodo'} ${item.fiber} ${item.count} hilos ${item.construction==='armada'?'Armado':'Indoor/Outdoor'} | Fiber Electronics`; if(!item.mode) return `Patch Cords Multimodo ${item.subtype} | Fiber Electronics`; return `Patch Cord ${item.subtype} ${item.mode} ${item.connA}-${item.connB} de ${item.length} m | Fiber Electronics`; }
function descriptionFor(item) { if(item?.slug) return `Consulta la ficha técnica de ${cableImportReference(item)}, cable ${item.family==='SM'?'monomodo':'multimodo'} ${item.fiber} de ${item.count} hilos, ${item.construction==='armada'?'armado para exteriores':'para uso interior y exterior'}, disponible por metros.`; if(!item.mode) return `Encuentra patch cords multimodo ${item.subtype} por conectores y longitud. Selecciona la referencia que necesitas y solicita atención por WhatsApp.`; return `Consulta el patch cord multimodo ${item.subtype} ${item.mode} ${item.connA}-${item.connB} de ${item.length} metros y solicita cotización y coordinación de envío por WhatsApp.`; }
function escapeAttr(value) { return String(value).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("'","&#39;").replaceAll("<","&lt;"); }
function sitemap() {
  const urls=["/","/bomaker.html",...patchcordRoutes.map(item=>item.path),...cableRoutes.map(item=>item.path)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(path=>`  <url><loc>https://www.fibersas.com${path}</loc><lastmod>2026-09-07</lastmod></url>`).join("\n")}\n</urlset>\n`;
}

function pdfText(value) {
  return String(value ?? "").replace(/[^\x20-\xFF]/g,"?").replaceAll("\\","\\\\").replaceAll("(","\\(").replaceAll(")","\\)");
}
function wrapPdf(value,limit=82) {
  const words=String(value||"").trim().split(/\s+/),lines=[];let line="";
  for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>limit&&line){lines.push(line);line=word}else line=next}
  if(line)lines.push(line);return lines.length?lines:[""];
}
function pdfQuantity(row) {
  const unit=row.qty===1?row.unit:({unidad:"unidades",servicio:"servicios"}[row.unit]||row.unit);
  return `${row.qty} ${unit}`;
}
function buildBomPdf(data) {
  const state=data?.state&&typeof data.state==="object"?data.state:{};
  const safeRows=Array.isArray(data?.rows)?data.rows.slice(0,80).map(row=>({description:clean(row.description,260),qty:Math.max(0,Number(row.qty)||0),unit:clean(row.unit,30)})):[];
  const consolidatedRows=[];
  for(const row of safeRows){const key=`${row.description.toLocaleLowerCase("es")}\u0000${row.unit.toLocaleLowerCase("es")}`,existing=consolidatedRows.find(item=>item.key===key);if(existing)existing.qty+=row.qty;else consolidatedRows.push({...row,key});}
  const warnings=Array.isArray(data?.warnings)?data.warnings.slice(0,12).map(item=>clean(item,240)):[];
  const reference=clean(data?.reference,100)||"PTP-FIBRA";
  const logical=[];
  logical.push({text:"Fiber Electronics - BOmaker PTP",font:"F2",size:18,gap:25});
  logical.push({text:`Referencia: ${reference}`,font:"F2",size:11,gap:17});
  logical.push({text:`Enlace: ${clean(state.speed,20)} | ${clean(state.fiberType,20)} | ${Number(state.distance)||0} m | ${state.linkMode==="bidi"?"BiDi / 1 fibra":"Duplex / 2 fibras"}`,font:"F1",size:10,gap:15});
  logical.push({text:`Cable: ${clean(state.cableFiber,20)} | ${Number(state.strands)||0} hilos | ${clean(state.construction,40)} | ${Number(data?.cableMeters)||0} m con reserva`,font:"F1",size:10,gap:24});
  logical.push({text:"RESUMEN CONSOLIDADO DE MATERIALES",font:"F2",size:12,gap:20});
  consolidatedRows.forEach((row,index)=>wrapPdf(`${index+1}. ${pdfQuantity(row)} - ${row.description}`,92).forEach((text,lineIndex)=>logical.push({text,font:"F1",size:9,gap:lineIndex===0?13:11,indent:lineIndex?14:0})));
  if(warnings.length){logical.push({text:"OBSERVACIONES",font:"F2",size:11,gap:22});warnings.forEach(item=>wrapPdf(`- ${item}`,92).forEach(text=>logical.push({text,font:"F1",size:9,gap:12})))}
  logical.push({text:"Diseño preliminar. Validar presupuesto óptico, ambiente, ruta, normativa y reserva antes de instalar.",font:"F1",size:8,gap:24});
  logical.push({text:"Fiber Electronics SAS | ventas@fibersas.com | +57 313 499 1444 | www.fibersas.com",font:"F1",size:8,gap:14});

  const pages=[];let page=[],y=790;
  for(const line of logical){if(y-line.gap<52){pages.push(page);page=[];y=790}page.push({...line,y});y-=line.gap}
  if(page.length)pages.push(page);
  const objectCount=5+pages.length*2,objects=new Array(objectCount+1);
  objects[1]="<< /Type /Catalog /Pages 2 0 R >>";
  objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  objects[5]=Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width 360 /Height 360 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pdfLogo.length} >>\nstream\n`,"latin1"),pdfLogo,Buffer.from("\nendstream","latin1")]);
  const kids=[];
  pages.forEach((lines,index)=>{const pageId=6+index*2,contentId=pageId+1;kids.push(`${pageId} 0 R`);const commands=["0.09 0.13 0.2 rg"];
    lines.forEach(line=>commands.push(`BT /${line.font} ${line.size} Tf 1 0 0 1 ${50+(line.indent||0)} ${line.y} Tm (${pdfText(line.text)}) Tj ET`));
    if(index===0)commands.push("q 66 0 0 66 478 744 cm /Im1 Do Q");
    commands.push("0.15 0.39 0.92 RG 2 w 50 815 m 545 815 l S");
    const stream=commands.join("\n");
    objects[contentId]=`<< /Length ${Buffer.byteLength(stream,"latin1")} >>\nstream\n${stream}\nendstream`;
    objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents ${contentId} 0 R >>`;
  });
  objects[2]=`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`;
  const chunks=[Buffer.from("%PDF-1.4\n%Fiber Electronics\n","latin1")],offsets=new Array(objectCount+1).fill(0);let offset=chunks[0].length;
  for(let id=1;id<=objectCount;id++){offsets[id]=offset;const value=Buffer.isBuffer(objects[id])?objects[id]:Buffer.from(String(objects[id]),"latin1"),chunk=Buffer.concat([Buffer.from(`${id} 0 obj\n`,"latin1"),value,Buffer.from("\nendobj\n","latin1")]);chunks.push(chunk);offset+=chunk.length}
  const xrefOffset=offset,xref=[`xref\n0 ${objectCount+1}\n0000000000 65535 f \n`];for(let id=1;id<=objectCount;id++)xref.push(`${String(offsets[id]).padStart(10,"0")} 00000 n \n`);
  xref.push(`trailer\n<< /Size ${objectCount+1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);chunks.push(Buffer.from(xref.join(""),"latin1"));return Buffer.concat(chunks);
}
async function renderPage(item, routeType='patchcord') { let html=await readFile(join(root,"index.html"),"utf8"); if(!item) return html; const title=titleFor(item),description=descriptionFor(item),url=`https://www.fibersas.com${item.path}`,dataAttribute=routeType==='cable'?'data-cable-route':'data-patchcord-route'; html=html.replace(/<title>.*?<\/title>/s,`<title>${escapeAttr(title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escapeAttr(description)}">`).replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`).replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${escapeAttr(title)}">`).replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${escapeAttr(description)}">`).replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${url}">`).replace("<body>",`<body ${dataAttribute}='${escapeAttr(JSON.stringify(item))}'>`); return html; }

async function overview(daysValue) {
  if(!pool) return {configured:false,totals:{},trend:[],topLines:[],topReferences:[],topSources:[],topLandings:[],recent:[],common:{summary:{views:0,consultations:0,downloads:0,contacts:0},trend:[],topPages:[],topItems:[],topDatasheets:[],sources:[],recent:[]}};
  const days=Math.min(Math.max(Number(daysValue)||30,1),365),cutoff=Date.now()-days*86400000;
  const result=await pool.query(`SELECT event_type,path,line,reference,session_id,source,metadata,created_at FROM fiber_events ORDER BY created_at DESC LIMIT 100000`);
  const totals={},daily=new Map(),lines=new Map(),references=new Map(),sources=new Map(),pages=new Map(),datasheets=new Map(),landings=new Map(),seenSessions=new Set(),recent=[];
  const count=(map,key)=>{if(key)map.set(key,(map.get(key)||0)+1)};
  for(const row of result.rows){
    const date=new Date(row.created_at); if(!Number.isFinite(date.getTime())||date.getTime()<cutoff)continue;
    totals[row.event_type]=(totals[row.event_type]||0)+1;
    if(row.event_type==='page_view'&&row.session_id&&!seenSessions.has(row.session_id)){seenSessions.add(row.session_id);if(parsePatchcordPath(row.path)||parseCablePath(row.path))count(landings,row.path)}
    if(recent.length<50)recent.push({...row,created_at:date.toISOString()});
    const day=date.toISOString().slice(0,10),item=daily.get(day)||{day,period:day,views:0,consultations:0,downloads:0,whatsapp:0};
    if(row.event_type==='page_view'){item.views++;count(pages,row.path)}
    if(row.event_type==='line_view'||row.event_type==='reference_view')item.consultations++;
    if(row.event_type==='datasheet_download'){item.downloads++;count(datasheets,row.reference||row.metadata?.title||row.path)}
    if(row.event_type==='whatsapp_click')item.whatsapp++;
    daily.set(day,item); count(lines,row.line); count(references,row.reference); if(row.event_type==='line_view'||row.event_type==='reference_view')count(sources,sourceGroup(row.source));
  }
  const ranked=map=>[...map].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count).slice(0,10);
  const trend=[...daily.values()].sort((a,b)=>a.day.localeCompare(b.day));
  return {configured:true,days,totals,trend,topLines:ranked(lines),topReferences:ranked(references),topSources:ranked(sources),topLandings:ranked(landings).slice(0,5),recent,
    common:{summary:{views:totals.page_view||0,consultations:(totals.line_view||0)+(totals.reference_view||0),downloads:totals.datasheet_download||0,contacts:(totals.whatsapp_click||0)+(totals.email_click||0)},trend,topPages:ranked(pages),topItems:ranked(references),topDatasheets:ranked(datasheets),sources:ranked(sources),recent:recent.map(row=>({created_at:row.created_at,event_type:row.event_type,item:row.reference||row.line||'—',path:row.path||'—',source:sourceGroup(row.source)}))}};
}

async function popularConfigurations(){
  if(!pool) return patchcordRoutes.slice(0,5).map(item=>({path:item.path,label:titleFor(item),count:0}));
  const result=await pool.query(`SELECT DISTINCT ON (session_id) session_id,path,created_at FROM fiber_events WHERE event_type='page_view' AND session_id IS NOT NULL AND created_at >= NOW()-INTERVAL '30 days' ORDER BY session_id,created_at ASC`);
  const counts=new Map(); for(const row of result.rows){if(parsePatchcordPath(row.path))counts.set(row.path,(counts.get(row.path)||0)+1)}
  const ranked=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([path,count])=>({path,label:titleFor(parsePatchcordPath(path)).replace(' | Fiber Electronics',''),count}));
  return ranked.length?ranked:patchcordRoutes.slice(0,5).map(item=>({path:item.path,label:titleFor(item).replace(' | Fiber Electronics',''),count:0}));
}

const server=createServer(async(req,res)=>{ applySecurityHeaders(res); try {
  const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);
  if(url.pathname==="/api/health") return json(res,200,{ok:true,database:Boolean(pool),service:"fiber"});
  if(url.pathname==="/api/popular-configurations") return json(res,200,{items:await popularConfigurations()});
  if(url.pathname==="/api/bomaker/pdf"&&req.method==="POST") { if(!sameOrigin(req)) return json(res,403,{error:"Invalid origin"}); const data=await body(req),pdf=buildBomPdf(data); res.writeHead(200,{"content-type":"application/pdf","content-disposition":`attachment; filename="BOmaker-${clean(data.reference,80)||"PTP"}.pdf"`,"cache-control":"no-store","x-content-type-options":"nosniff"}); return res.end(pdf); }
  if(url.pathname==="/sitemap.xml") { res.writeHead(200,{"content-type":"application/xml; charset=utf-8","cache-control":"public, max-age=3600"}); return res.end(sitemap()); }
  if(url.pathname==="/api/events"&&req.method==="POST") { const data=await body(req); if(!allowedEvents.has(data.type)) return json(res,400,{error:"Unsupported event"}); const values=[data.type,clean(data.path,300),clean(data.line,80)||null,clean(data.reference,160)||null,clean(data.sessionId,80),clean(data.source,100)||null,data.metadata&&typeof data.metadata==="object"?data.metadata:{}]; if(pool) await pool.query(`INSERT INTO fiber_events(event_type,path,line,reference,session_id,source,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)`,values); return json(res,202,{ok:true}); }
  if(url.pathname==="/api/admin/login"&&req.method==="POST") { if(!sameOrigin(req)) return json(res,403,{error:"Invalid origin"}); const ip=req.socket.remoteAddress||"unknown",record=attempts.get(ip)||{count:0,reset:Date.now()+600000}; if(record.reset<Date.now()) Object.assign(record,{count:0,reset:Date.now()+600000}); if(record.count>=8) return json(res,429,{error:"Too many attempts"}); const data=await body(req); if(data.username!==adminUser||!validPassword(data.password)){record.count++;attempts.set(ip,record);return json(res,401,{error:"Invalid credentials"});} attempts.delete(ip); const token=sign({user:adminUser,exp:Date.now()+12*60*60*1000,nonce:randomBytes(8).toString("hex")}); return json(res,200,{ok:true},{"set-cookie":`fiber_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${production?"; Secure":""}`}); }
  if(url.pathname==="/api/admin/logout"&&req.method==="POST") return json(res,200,{ok:true},{"set-cookie":"fiber_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"});
  if(url.pathname==="/api/admin/session") return json(res,adminSession(req)?200:401,{authenticated:Boolean(adminSession(req))});
  if(url.pathname==="/api/admin/overview") { if(!adminSession(req)) return json(res,401,{error:"Unauthorized"}); return json(res,200,await overview(url.searchParams.get("days"))); }
  const item=parsePatchcordPath(url.pathname);
  if(url.pathname.startsWith("/patch-cords/")) { if(!item) return json(res,404,{error:"Referencia no encontrada"}); const html=await renderPage(item); res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-cache","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}); return res.end(html); }
  const cableItem=parseCablePath(url.pathname);
  if(url.pathname.startsWith("/cables-fibra/")) { if(!cableItem) return json(res,404,{error:"Referencia no encontrada"}); const html=await renderPage(cableItem,'cable'); res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-cache","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}); return res.end(html); }
  let requested=url.pathname==="/"?"/index.html":url.pathname==="/admin"||url.pathname==="/admin/"?"/admin.html":url.pathname==="/bomaker"||url.pathname==="/bomaker/"?"/bomaker.html":url.pathname;
  const safe=normalize(requested).replace(/^(\.\.(\/|\\|$))+/g,""); const file=publicFile(root,decodeURIComponent(requested)); if(!file) return json(res,404,{error:"Not found"}); const info=await stat(file); if(!info.isFile()) throw Object.assign(new Error("Not found"),{code:"ENOENT"}); res.writeHead(200,{"content-type":mime[extname(file).toLowerCase()]||"application/octet-stream","cache-control":production&&!file.endsWith(".html")?"public, max-age=86400":"no-cache","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}); res.end(await readFile(file));
} catch(error) { console.error('Request failed',req.method,req.url,error); const notFound=error?.code==="ENOENT"; if(!res.headersSent) json(res,notFound?404:500,{error:notFound?"Not found":"Server error"}); else res.end(); }});
server.listen(port,()=>console.log(`Fiber Electronics listening on ${port}`));
