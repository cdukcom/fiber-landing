import { track } from './analytics.js'
import { converterReachOptions, formatReach, converterDistanceWarning } from './bomaker-reach.js'

const form=document.querySelector('#bom-form'),alerts=document.querySelector('#bom-alerts'),rowsTarget=document.querySelector('#bom-rows'),diagram=document.querySelector('#bom-diagram'),status=document.querySelector('#bom-status'),whatsapp=document.querySelector('#bom-whatsapp'),pdfButton=document.querySelector('#bom-pdf'),copyButton=document.querySelector('#bom-copy')
const labels={switch:'Switch existente',converter:'Conversor Speednet',existing:'Equipo existente',box6:'Caja óptica Fiber Electronics de 6 hilos',box12:'Caja óptica Fiber Electronics de 12 hilos',odf24:'ODF Fiber Electronics de 24 hilos',armada:'Armado para exterior','indoor-outdoor':'Indoor / Outdoor'}
const cableCatalog=[
  {family:'SM',fiber:'OS2',construction:'armada',strands:12,reference:'Cable Monomodo Armado OS2 12 hilos'},
  ...['OM3','OM4'].flatMap(fiber=>['indoor-outdoor','armada'].flatMap(construction=>[6,12].map(strands=>({family:'MM',fiber,construction,strands,reference:`Cable Multimodo ${labels[construction]} ${fiber} ${strands} hilos`}))))
]
let sfpCatalog=[],converterCatalog=[],lastDesign=null,inheritedCable=true
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const value=name=>form.elements[name].value
const number=name=>Math.max(0,Number(value(name))||0)
const speedMbps=state=>state.speed==='100M'?100:state.speed==='1G'?1000:10000
const reachMeters=item=>item?.reach ? Number(item.reach.value)*(item.reach.unit==='km'?1000:1) : Infinity
const topology=state=>state.linkMode==='bidi'?'single-fiber-bidi':'dual-fiber'
const productById=id=>[...sfpCatalog,...converterCatalog].find(item=>item.id===id)
const setOptions=(select,items,selected,label=item=>item)=>{select.innerHTML=items.map(item=>`<option value="${escapeHtml(item.id??item)}">${escapeHtml(label(item))}</option>`).join('');const values=items.map(item=>String(item.id??item));select.value=values.includes(String(selected))?String(selected):(values[0]||'')}

function compatibleProducts(state,end){
  const active=state[`active${end}`]
  if(active==='existing')return[]
  if(active==='converter')return converterCatalog.filter(item=>item.networkRatesMbps?.includes(speedMbps(state))&&item.fiberMode===state.fiberFamily&&item.fiberCount===(state.linkMode==='bidi'?1:2))
  return sfpCatalog.filter(item=>item.ethernetRateGbps===speedMbps(state)/1000&&item.fiberMode===state.fiberFamily&&item.topology===topology(state)&&reachMeters(item)>=state.distance)
}
function basicState(){return{speed:value('speed'),fiberFamily:value('fiberFamily'),fiberType:value('fiberType'),linkMode:value('linkMode'),distance:Math.max(1,Math.floor(number('distance'))),activeA:value('activeA'),activeB:value('activeB')}}
function syncEndpointProducts(preferred={}){
  const state=basicState()
  ;['A','B'].forEach(end=>{
    const select=form.elements[`product${end}`],active=state[`active${end}`],wrap=select.closest('.endpoint-product')
    let products=compatibleProducts(state,end)
    if(end==='B'&&state.linkMode==='bidi'&&active==='switch'){
      const first=productById(form.elements.productA.value),pair=first?.pairId&&products.find(item=>item.id===first.pairId)
      if(pair)products=[pair,...products.filter(item=>item.id!==pair.id)]
    }
    setOptions(select,products,preferred[end]||select.value,item=>`${item.id} — ${item.name}`)
    select.disabled=active==='existing'||products.length===0;wrap.hidden=active==='existing'
    const reachSelect=form.elements[`nominalReach${end}`],reachWrap=reachSelect.closest('.endpoint-reach')
    const reaches=active==='converter'?converterReachOptions(productById(select.value),state):[]
    setOptions(reachSelect,reaches,reachSelect.value,item=>formatReach(item.id))
    reachSelect.disabled=reaches.length===0;reachWrap.hidden=active!=='converter'||reaches.length===0
  })
}
function syncLinkFiber(){
  const family=value('fiberFamily'),types=family==='SM'?['OS2']:['OM3','OM4']
  setOptions(form.elements.fiberType,types,value('fiberType'))
  if(value('speed')==='100M'&&value('activeA')==='switch')form.elements.activeA.value='converter'
  if(value('speed')==='100M'&&value('activeB')==='switch')form.elements.activeB.value='converter'
}
function syncCable(){
  const family=value('cableFamily'),previous={fiber:value('cableFiber'),construction:value('construction'),strands:value('strands')},byFamily=cableCatalog.filter(item=>item.family===family)
  setOptions(form.elements.cableFiber,[...new Set(byFamily.map(item=>item.fiber))],previous.fiber)
  const byFiber=byFamily.filter(item=>item.fiber===value('cableFiber'))
  setOptions(form.elements.construction,[...new Set(byFiber.map(item=>item.construction))],previous.construction,item=>labels[item])
  const byConstruction=byFiber.filter(item=>item.construction===value('construction'))
  setOptions(form.elements.strands,[...new Set(byConstruction.map(item=>item.strands))],previous.strands,item=>`${item} hilos`)
}
function collect(){return{...basicState(),reserve:Math.min(50,Math.floor(number('reserve'))),cableFamily:value('cableFamily'),cableFiber:value('cableFiber'),construction:value('construction'),strands:Number(value('strands')),productA:value('productA'),productB:value('productB'),nominalReachA:number('nominalReachA'),nominalReachB:number('nominalReachB'),terminationA:value('terminationA'),terminationConnectorA:value('terminationConnectorA'),patchLengthA:Math.max(1,Math.floor(number('patchLengthA'))),terminationB:value('terminationB'),terminationConnectorB:value('terminationConnectorB'),patchLengthB:Math.max(1,Math.floor(number('patchLengthB')))}}
function selectedProductLabel(state,end){const product=productById(state[`product${end}`]);return product?`${product.id} — ${product.name}${state[`active${end}`]==='converter'&&state[`nominalReach${end}`]?` · alcance nominal ${formatReach(state[`nominalReach${end}`])}`:''}`:'No hay referencia compatible disponible'}
function productLabel(state,end){const active=state[`active${end}`],product=productById(state[`product${end}`]);if(active==='existing')return'Óptica existente / no incluida';return selectedProductLabel(state,end)}
function opticalConnector(state,end){const product=productById(state[`product${end}`]);if(product?.connector)return product.connector.split(' ')[0];return state[`active${end}`]==='converter'?'SC':'LC'}
function endpointRows(state,end){
  const active=state[`active${end}`],product=productById(state[`product${end}`]),termination=state[`termination${end}`],terminationConnector=state[`terminationConnector${end}`],patchLength=state[`patchLength${end}`],used=state.linkMode==='bidi'?1:2,sourceConnector=opticalConnector(state,end),rows=[]
  if(active!=='existing'&&product)rows.push({item:`Producto activo ${end}`,description:selectedProductLabel(state,end),qty:1,unit:'unidad'})
  rows.push({item:`Patch cord ${end}`,description:`Patch Cord ${state.fiberType} ${state.linkMode==='bidi'?'Simplex':'Duplex'} ${sourceConnector}-${terminationConnector} ${patchLength}m`,qty:1,unit:'unidad'})
  if(termination!=='existing'){
    rows.push({item:`Terminación ${end}`,description:`${labels[termination]} equipada para ${terminationConnector}`,qty:1,unit:'unidad'})
    rows.push({item:`Pigtails ${end}`,description:`Pigtail ${state.fiberType} ${terminationConnector}`,qty:used,unit:'unidad'})
    rows.push({item:`Adaptadores ${end}`,description:`Adaptador ${terminationConnector} para ${state.fiberType}`,qty:used,unit:'unidad'})
  }
  return rows
}
function validate(state){
  const warnings=[],required=state.linkMode==='bidi'?1:2,a=productById(state.productA),b=productById(state.productB)
  if(state.cableFamily!==state.fiberFamily||state.cableFiber!==state.fiberType)warnings.push('El cable seleccionado no coincide con la fibra de las referencias activas.')
  if(state.strands<required)warnings.push(`El enlace necesita al menos ${required} ${required===1?'hilo':'hilos'} disponible(s).`)
  if(state.activeA!=='existing'&&!a)warnings.push('No existe una referencia del catálogo compatible para el extremo A.')
  if(state.activeB!=='existing'&&!b)warnings.push('No existe una referencia del catálogo compatible para el extremo B.')
  if(state.linkMode==='bidi'&&a?.pairId&&b?.id!==a.pairId)warnings.push(`El extremo B recomendado para ${a.id} es su par complementario ${a.pairId}.`)
  for(const end of ['A','B']){
    if(state[`active${end}`]!=='converter')continue
    const warning=converterDistanceWarning({product:productById(state[`product${end}`]),nominalReach:state[`nominalReach${end}`],distance:state.distance,end})
    if(warning)warnings.push(warning)
  }
  if(state.linkMode==='bidi'&&state.fiberFamily==='MM')warnings.push('El catálogo Speednet no ofrece BiDi multimodo para esta combinación.')
  return warnings
}
function buildDesign(){
  const state=collect(),cableMeters=Math.ceil(state.distance*(1+state.reserve/100)),used=state.linkMode==='bidi'?1:2,cable=cableCatalog.find(item=>item.family===state.cableFamily&&item.fiber===state.cableFiber&&item.construction===state.construction&&item.strands===state.strands)
  const rows=[...endpointRows(state,'A'),{item:'Cable principal',description:`${cable?.reference||'Cable Fiber Electronics'} (${state.reserve}% de reserva incluida)`,qty:cableMeters,unit:'m'},{item:'Fusiones',description:`Fusiones para ${used} ${used===1?'fibra':'fibras'} en cada extremo`,qty:used*2,unit:'servicio'},...endpointRows(state,'B')]
  return{state,rows,warnings:validate(state),cableMeters,reference:`PTP-${state.speed}-${state.fiberType}-${state.linkMode.toUpperCase()}-${state.distance}M`}
}
const node=(icon,title,detail)=>`<div class="diagram-node"><span>${icon}</span><b>${escapeHtml(title)}</b><small>${escapeHtml(detail)}</small></div>`
function render(){
  const design=buildDesign(),{state}=design;lastDesign=design
  document.querySelector('#summary-A').innerHTML=`<b>Referencia seleccionada</b><span>${escapeHtml(productLabel(state,'A'))}</span>`;document.querySelector('#summary-B').innerHTML=`<b>Referencia seleccionada</b><span>${escapeHtml(productLabel(state,'B'))}</span>`
  diagram.innerHTML=`${node('A',labels[state.activeA],productLabel(state,'A'))}<i></i>${node('◫',labels[state.terminationA],`${state.terminationConnectorA} · ${state.patchLengthA} m`)}<div class="diagram-cable"><b>${escapeHtml(`${state.cableFiber} · ${state.strands} hilos`)}</b><span>${design.cableMeters} m con reserva</span></div>${node('◫',labels[state.terminationB],`${state.terminationConnectorB} · ${state.patchLengthB} m`)}<i></i>${node('B',labels[state.activeB],productLabel(state,'B'))}`
  rowsTarget.innerHTML=design.rows.map((row,index)=>`<tr><td>${index+1}</td><td><span contenteditable="true" spellcheck="false">${escapeHtml(row.description)}</span></td><td><input class="bom-qty" type="number" min="0" step="1" value="${row.qty}" aria-label="Cantidad de ${escapeHtml(row.item)}"></td><td>${escapeHtml(row.unit)}</td></tr>`).join('')
  alerts.innerHTML=design.warnings.length?design.warnings.map(message=>`<p><b>Revisar:</b> ${escapeHtml(message)}</p>`).join(''):'<p class="is-ok"><b>Lista de materiales preparada.</b> Referencias del catálogo Fiber Electronics / Speednet.</p>'
  status.textContent=design.warnings.length?`${design.warnings.length} aviso${design.warnings.length===1?'':'s'}`:'Lista de materiales preparada';status.classList.toggle('has-warnings',Boolean(design.warnings.length));whatsapp.href=`https://wa.me/573134991444?text=${encodeURIComponent(summaryText())}`
}
function currentRows(){return[...rowsTarget.querySelectorAll('tr')].map((row,index)=>({item:String(index+1),description:row.querySelector('[contenteditable]').textContent.trim(),qty:Number(row.querySelector('input').value)||0,unit:row.cells[3].textContent.trim()}))}
function consolidatedRows(){const grouped=new Map();for(const row of currentRows()){const key=`${row.description.toLocaleLowerCase('es')}\u0000${row.unit.toLocaleLowerCase('es')}`,existing=grouped.get(key);if(existing)existing.qty+=row.qty;else grouped.set(key,{...row})}return[...grouped.values()]}
function quantityText(row){const unit=row.qty===1?row.unit:({unidad:'unidades',servicio:'servicios'}[row.unit]||row.unit);return`${row.qty} ${unit}`}
function summaryText(){if(!lastDesign)return'';const{state,reference}=lastDesign,lines=consolidatedRows().map(row=>`- ${quantityText(row)}: ${row.description}`);return`Hola Fiber Electronics, diseñé este enlace en BOmaker:\n\nReferencia: ${reference}\n${state.speed} · ${state.fiberType} · ${state.distance} m · ${state.linkMode==='bidi'?'BiDi':'Duplex'}\n\nResumen consolidado de materiales:\n${lines.join('\n')}\n\nOrigen: fibersas.com/BOmaker`}
form.addEventListener('change',event=>{
  const name=event.target.name,previous={A:value('productA'),B:value('productB')}
  if(['speed','fiberFamily','fiberType','linkMode','distance','activeA','activeB'].includes(name)){
    if(name==='fiberFamily'){syncLinkFiber();if(inheritedCable){form.elements.cableFamily.value=value('fiberFamily');syncCable();form.elements.cableFiber.value=value('fiberType');syncCable()}}
    if(name==='fiberType'&&inheritedCable){form.elements.cableFiber.value=value('fiberType');syncCable()}
    syncEndpointProducts(previous)
  }
  if(name==='productA'||name==='productB')syncEndpointProducts({A:value('productA'),B:value('productB')})
  if(name==='cableFamily'||name==='cableFiber'||name==='construction'){inheritedCable=false;syncCable()}
  if(name==='strands'){const n=Number(value('strands')),suggested=n<=6?'box6':n<=12?'box12':'odf24';form.elements.terminationA.value=suggested;form.elements.terminationB.value=suggested}
  render();track('selector_change',{line:'bomaker',reference:lastDesign.reference})
})
form.addEventListener('input',event=>{if(event.target.matches('input')){if(event.target.name==='distance')syncEndpointProducts();render()}})
document.querySelector('#bom-reset').addEventListener('click',()=>{form.reset();inheritedCable=true;syncLinkFiber();syncCable();syncEndpointProducts();render()})
copyButton.addEventListener('click',async()=>{const text=summaryText();try{await navigator.clipboard.writeText(text);copyButton.textContent='✓ Resumen copiado';setTimeout(()=>copyButton.textContent='Copiar resumen',1800)}catch{window.prompt('Copia este resumen:',text)}track('configuration_complete',{line:'bomaker',reference:lastDesign.reference,metadata:{format:'copy'}})})
whatsapp.addEventListener('click',()=>{whatsapp.href=`https://wa.me/573134991444?text=${encodeURIComponent(summaryText())}`;track('whatsapp_click',{line:'bomaker',reference:lastDesign.reference})})
pdfButton.addEventListener('click',async()=>{pdfButton.disabled=true;pdfButton.textContent='Generando PDF…';try{const response=await fetch('/api/bomaker/pdf',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...lastDesign,state:lastDesign.state,rows:currentRows()})});if(!response.ok)throw new Error('No fue posible generar el PDF');const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');link.href=url;link.download=`BOmaker-${lastDesign.reference}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);track('configuration_complete',{line:'bomaker',reference:lastDesign.reference,metadata:{format:'pdf'}})}catch(error){alert(error.message)}finally{pdfButton.disabled=false;pdfButton.textContent='Descargar PDF'}})
async function init(){
  try{const[sfp,converters]=await Promise.all([fetch('/data/speednet-sfp.json').then(r=>r.json()),fetch('/data/speednet-media-converters.json?v=20261003-1').then(r=>r.json())]);sfpCatalog=sfp.items.filter(item=>[1,10].includes(item.ethernetRateGbps)&&['SM','MM'].includes(item.fiberMode)&&['dual-fiber','single-fiber-bidi'].includes(item.topology));converterCatalog=converters.items;syncLinkFiber();syncCable();syncEndpointProducts();render();track('selector_open',{line:'bomaker'})}catch(error){alerts.innerHTML='<p><b>No fue posible cargar el catálogo.</b> Recargue la página o contáctenos por WhatsApp.</p>';console.error(error)}
}
init()
