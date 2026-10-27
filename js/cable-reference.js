export function cableImportReference(item) {
  const count = item.count ?? item.strands
  if (item.family === 'SM') return `GYXTW ${count}C SM G652D`
  const model = item.construction === 'armada' ? 'GYXTW' : 'JET'
  return `${model} ${count}C MM ${item.fiber}`
}
