import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { Pool } from "pg";

const root = process.cwd();
const port = Number(process.env.PORT || 8766);
const production = process.env.NODE_ENV === "production";
const secret = process.env.VERIFY_SECRET || "local-fiber-development-secret";
const adminUser = process.env.ADMIN_USER || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin";
const pool = process.env.DATABASE_URL ? new Pool({connectionString:process.env.DATABASE_URL,ssl:production?{rejectUnauthorized:false}:false}) : null;
const attempts = new Map();
const allowedEvents = new Set(["page_view","line_view","selector_open","selector_change","reference_view","outbound_tool","whatsapp_click","email_click","datasheet_download"]);
const mime = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".pdf":"application/pdf",".txt":"text/plain; charset=utf-8",".xml":"application/xml; charset=utf-8",".ico":"image/x-icon"};
const patchcordRoutes = JSON.parse(await readFile(join(root,"data/patchcord-routes.json"),"utf8"));
const routeMap = new Map(patchcordRoutes.map(item => [item.path,item]));
const validLengths = new Set([1,2,3,5,10,15,20,25,40,50,80,100]);
function parsePatchcordPath(pathname) {
  if (routeMap.has(pathname)) return routeMap.get(pathname);
  const match=pathname.match(/^\/patch-cords\/(multimodo|monomodo)\/(om2|om3|om4|os2)\/(duplex|simplex)\/(lc|sc|st|fc)-(lc|sc|st|fc)-(\d+)m\/$/i);
  if(!match) return null;
  const [,familySlug,subtype,mode,connA,connB,lengthRaw]=match,length=Number(lengthRaw);
  if(!validLengths.has(length)||(familySlug==="multimodo"&&subtype.toLowerCase()==="os2")||(familySlug==="monomodo"&&subtype.toLowerCase()!=="os2")) return null;
  return {path:pathname,family:familySlug==="multimodo"?"MM":"SM",subtype:subtype.toUpperCase(),mode:mode[0].toUpperCase()+mode.slice(1).toLowerCase(),connA:connA.toUpperCase(),connB:connB.toUpperCase(),length};
}

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
function titleFor(item) { if(!item) return "Fiber Electronics | Fibra óptica, SFP y conectividad"; if(!item.mode) return `Patch Cords Multimodo ${item.subtype} | Fiber Electronics`; return `Patch Cord ${item.subtype} ${item.mode} ${item.connA}-${item.connB} de ${item.length} m | Fiber Electronics`; }
function descriptionFor(item) { if(!item.mode) return `Encuentra patch cords multimodo ${item.subtype} por conectores y longitud. Selecciona la referencia que necesitas y solicita atención por WhatsApp.`; return `Consulta el patch cord multimodo ${item.subtype} ${item.mode} ${item.connA}-${item.connB} de ${item.length} metros y solicita cotización y coordinación de envío por WhatsApp.`; }
function escapeAttr(value) { return String(value).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("'","&#39;").replaceAll("<","&lt;"); }
async function renderPage(item) { let html=await readFile(join(root,"index.html"),"utf8"); if(!item) return html; const title=titleFor(item),description=descriptionFor(item),url=`https://www.fibersas.com${item.path}`; html=html.replace(/<title>.*?<\/title>/s,`<title>${escapeAttr(title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escapeAttr(description)}">`).replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`).replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${escapeAttr(title)}">`).replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${escapeAttr(description)}">`).replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${url}">`).replace("<body>",`<body data-patchcord-route='${escapeAttr(JSON.stringify(item))}'>`); return html; }

async function overview(daysValue) {
  if(!pool) return {configured:false,totals:{},trend:[],topLines:[],topReferences:[],topSources:[],recent:[]};
  const days=Math.min(Math.max(Number(daysValue)||30,1),365), interval=`${days} days`;
  const [totals,trend,lines,references,sources,recent]=await Promise.all([
    pool.query(`SELECT event_type,COUNT(*)::int total FROM fiber_events WHERE created_at>=NOW()-$1::interval GROUP BY event_type`,[interval]),
    pool.query(`SELECT TO_CHAR(day,'YYYY-MM-DD') day,COUNT(e.id) FILTER(WHERE event_type='page_view')::int views,COUNT(e.id) FILTER(WHERE event_type IN('line_view','reference_view'))::int consultations,COUNT(e.id) FILTER(WHERE event_type='whatsapp_click')::int whatsapp FROM generate_series(CURRENT_DATE-($1::int-1),CURRENT_DATE,'1 day') day LEFT JOIN fiber_events e ON e.created_at>=day AND e.created_at<day+INTERVAL '1 day' GROUP BY day ORDER BY day`,[days]),
    pool.query(`SELECT line label,COUNT(*)::int count FROM fiber_events WHERE line IS NOT NULL AND created_at>=NOW()-$1::interval GROUP BY line ORDER BY count DESC LIMIT 10`,[interval]),
    pool.query(`SELECT reference label,COUNT(*)::int count FROM fiber_events WHERE reference IS NOT NULL AND created_at>=NOW()-$1::interval GROUP BY reference ORDER BY count DESC LIMIT 10`,[interval]),
    pool.query(`SELECT COALESCE(source,'direct') label,COUNT(*)::int count FROM fiber_events WHERE created_at>=NOW()-$1::interval GROUP BY source ORDER BY count DESC LIMIT 10`,[interval]),
    pool.query(`SELECT event_type,path,line,reference,source,metadata,created_at FROM fiber_events ORDER BY created_at DESC LIMIT 50`)
  ]);
  return {configured:true,days,totals:Object.fromEntries(totals.rows.map(r=>[r.event_type,r.total])),trend:trend.rows,topLines:lines.rows,topReferences:references.rows,topSources:sources.rows,recent:recent.rows};
}

const server=createServer(async(req,res)=>{ try {
  const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);
  if(url.pathname==="/api/health") return json(res,200,{ok:true,database:Boolean(pool),service:"fiber"});
  if(url.pathname==="/api/events"&&req.method==="POST") { const data=await body(req); if(!allowedEvents.has(data.type)) return json(res,400,{error:"Unsupported event"}); const values=[data.type,clean(data.path,300),clean(data.line,80)||null,clean(data.reference,160)||null,clean(data.sessionId,80),clean(data.source,100)||null,data.metadata&&typeof data.metadata==="object"?data.metadata:{}]; if(pool) await pool.query(`INSERT INTO fiber_events(event_type,path,line,reference,session_id,source,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)`,values); return json(res,202,{ok:true}); }
  if(url.pathname==="/api/admin/login"&&req.method==="POST") { if(!sameOrigin(req)) return json(res,403,{error:"Invalid origin"}); const ip=req.socket.remoteAddress||"unknown",record=attempts.get(ip)||{count:0,reset:Date.now()+600000}; if(record.reset<Date.now()) Object.assign(record,{count:0,reset:Date.now()+600000}); if(record.count>=8) return json(res,429,{error:"Too many attempts"}); const data=await body(req); if(data.username!==adminUser||!validPassword(data.password)){record.count++;attempts.set(ip,record);return json(res,401,{error:"Invalid credentials"});} attempts.delete(ip); const token=sign({user:adminUser,exp:Date.now()+12*60*60*1000,nonce:randomBytes(8).toString("hex")}); return json(res,200,{ok:true},{"set-cookie":`fiber_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${production?"; Secure":""}`}); }
  if(url.pathname==="/api/admin/logout"&&req.method==="POST") return json(res,200,{ok:true},{"set-cookie":"fiber_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"});
  if(url.pathname==="/api/admin/session") return json(res,adminSession(req)?200:401,{authenticated:Boolean(adminSession(req))});
  if(url.pathname==="/api/admin/overview") { if(!adminSession(req)) return json(res,401,{error:"Unauthorized"}); return json(res,200,await overview(url.searchParams.get("days"))); }
  const item=parsePatchcordPath(url.pathname);
  if(url.pathname.startsWith("/patch-cords/")) { if(!item) return json(res,404,{error:"Referencia no encontrada"}); const html=await renderPage(item); res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-cache","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}); return res.end(html); }
  let requested=url.pathname==="/"?"/index.html":url.pathname==="/admin"||url.pathname==="/admin/"?"/admin.html":url.pathname;
  const safe=normalize(requested).replace(/^(\.\.(\/|\\|$))+/g,""); const file=join(root,safe); if(!file.startsWith(root)) return json(res,403,{error:"Forbidden"}); const info=await stat(file); if(!info.isFile()) throw Object.assign(new Error("Not found"),{code:"ENOENT"}); res.writeHead(200,{"content-type":mime[extname(file).toLowerCase()]||"application/octet-stream","cache-control":production&&!file.endsWith(".html")?"public, max-age=86400":"no-cache","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}); res.end(await readFile(file));
} catch(error) { const notFound=error?.code==="ENOENT"; if(!res.headersSent) json(res,notFound?404:500,{error:notFound?"Not found":"Server error"}); else res.end(); }});
server.listen(port,()=>console.log(`Fiber Electronics listening on ${port}`));
