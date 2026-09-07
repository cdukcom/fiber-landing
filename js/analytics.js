const sessionId=localStorage.getItem("fiber_session")||crypto.randomUUID();
localStorage.setItem("fiber_session",sessionId);
const params=new URLSearchParams(location.search);
const attribution={utm_source:params.get("utm_source"),utm_medium:params.get("utm_medium"),utm_campaign:params.get("utm_campaign"),referrer:document.referrer||null};
const source=params.get("utm_source")||params.get("source")||(document.referrer?new URL(document.referrer).hostname:"direct");

export function track(type,details={}) {
  const payload=JSON.stringify({type,path:location.pathname,sessionId,source,line:details.line||null,reference:details.reference||null,metadata:{...attribution,...(details.metadata||{})}});
  if(navigator.sendBeacon){navigator.sendBeacon("/api/events",new Blob([payload],{type:"application/json"}));return;}
  fetch("/api/events",{method:"POST",headers:{"content-type":"application/json"},body:payload,keepalive:true}).catch(()=>{});
}
