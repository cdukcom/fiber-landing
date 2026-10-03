// Nominal manufacturer reach is checked independently of an optical link budget.
export function converterReachOptions(product,state){
  const rate=state.speed==='100M'?100:state.speed==='1G'?1000:10000
  return (product?.reachOptions||[])
    .filter(option=>(!option.ratesMbps||option.ratesMbps.includes(rate))&&(!option.fiberTypes||option.fiberTypes.includes(state.fiberType)))
    .map(option=>({id:String(Number(option.value)*(option.unit==='km'?1000:1))}))
}
export function formatReach(meters){return Number(meters)>=1000?`${Number(meters)/1000} km`:`${Number(meters)} m`}
export function converterDistanceWarning({product,nominalReach,distance,end}){
  if(!product||!nominalReach||distance<=nominalReach)return null
  return `Extremo ${end}: la distancia del enlace (${formatReach(distance)}) supera el alcance nominal de ${product.id}: ${formatReach(nominalReach)}.`
}
