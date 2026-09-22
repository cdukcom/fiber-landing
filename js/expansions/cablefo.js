import { track } from '../analytics.js'

const CABLES = [
  { family:'SM', construction:'armada', fiber:'OS2', count:12, slug:'monomodo-armada-os2-12-hilos' },
  ...['indoor-outdoor', 'armada'].flatMap(construction =>
    ['OM3', 'OM4'].flatMap(fiber => [6, 12].map(count => ({ family:'MM', construction, fiber, count, slug:`multimodo-${construction}-${fiber.toLowerCase()}-${count}-hilos` })))
  )
]

const LABELS = { SM:'Monomodo', MM:'Multimodo', armada:'Armada', 'indoor-outdoor':'Indoor / Outdoor' }
const CABLE_IMAGES = {
  armada: {
    src:'/img/cable-types/armada.webp',
    alt:'Corte del cable de fibra óptica armado GYXTW'
  },
  'indoor-outdoor': {
    src:'/img/cable-types/indoor-outdoor.webp',
    alt:'Corte del cable de fibra óptica indoor y outdoor no metálico'
  }
}

export function renderCablefo(container, initial = {}) {
  container.innerHTML = `
    <div class="expansion-panel">
      <div class="pc-visual cablefo-visual">
        <img id="cable-image" src="/img/cable-types/armada.webp" class="pc-image cablefo-image" alt="Corte del cable de fibra óptica armado GYXTW">
        <div class="cablefo-meter-badge">Venta por metros</div>
      </div>
      <div class="expansion-content">
        <div class="expansion-header">
          <h2>Cable Fibra Óptica</h2>
          <button class="expansion-back" type="button">← Volver</button>
        </div>
        <p class="cablefo-intro">Configura la referencia disponible y descarga su ficha técnica estandarizada.</p>
        <div class="pc-form">
          <label for="cable-family">Familia</label>
          <select id="cable-family"><option value="SM">Monomodo</option><option value="MM">Multimodo</option></select>
          <label for="cable-construction">Construcción</label>
          <select id="cable-construction"></select>
          <label for="cable-fiber">Tipo de fibra</label>
          <select id="cable-fiber"></select>
          <label for="cable-count">Número de hilos</label>
          <select id="cable-count"></select>
          <label for="cable-meters">Cantidad requerida (metros)</label>
          <input id="cable-meters" type="number" min="1" step="1" value="1" inputmode="numeric">
        </div>
        <div id="cable-result" class="pc-result" aria-live="polite"></div>
        <div id="cable-info" class="pc-info"></div>
        <div class="cablefo-actions">
          <a id="cable-datasheet" class="btn-datasheet" target="_blank" rel="noopener noreferrer">Descargar ficha técnica</a>
          <a id="cable-whatsapp" class="btn-whatsapp" target="_blank" rel="noopener noreferrer">Cotizar por WhatsApp</a>
        </div>
        <button id="cable-copy-link" type="button" class="btn-disabled">Copiar enlace de esta referencia</button>
      </div>
    </div>`

  setTimeout(() => {
    const family = container.querySelector('#cable-family')
    const construction = container.querySelector('#cable-construction')
    const fiber = container.querySelector('#cable-fiber')
    const count = container.querySelector('#cable-count')
    const meters = container.querySelector('#cable-meters')
    const cableImage = container.querySelector('#cable-image')
    const result = container.querySelector('#cable-result')
    const info = container.querySelector('#cable-info')
    const datasheet = container.querySelector('#cable-datasheet')
    const whatsapp = container.querySelector('#cable-whatsapp')
    const copyLink = container.querySelector('#cable-copy-link')
    const unique = (items, key) => [...new Set(items.map(item => item[key]))]
    const setOptions = (select, values, label = value => value) => {
      const previous = select.value
      select.innerHTML = values.map(value => `<option value="${value}">${label(value)}</option>`).join('')
      if (values.map(String).includes(previous)) select.value = previous
    }
    const compatible = (filters = {}) => CABLES.filter(item => Object.entries(filters).every(([key, value]) => String(item[key]) === String(value)))
    const loadConstruction = () => setOptions(construction, unique(compatible({family:family.value}), 'construction'), value => LABELS[value])
    const loadFiber = () => setOptions(fiber, unique(compatible({family:family.value, construction:construction.value}), 'fiber'))
    const loadCount = () => setOptions(count, unique(compatible({family:family.value, construction:construction.value, fiber:fiber.value}), 'count'), value => `${value} hilos`)
    const selectedCable = () => compatible({family:family.value, construction:construction.value, fiber:fiber.value, count:count.value})[0]
    const selectedPath = (item = selectedCable()) => item ? `/cables-fibra/${item.slug}/` : '/'
    const reference = item => `Cable ${LABELS[item.family]} ${LABELS[item.construction]} ${item.fiber} ${item.count} hilos`

    function updateImage(item) {
      const image = CABLE_IMAGES[item.construction]
      if (!image || cableImage.getAttribute('src') === image.src) return
      cableImage.classList.add('is-changing')
      const revealImage = () => cableImage.classList.remove('is-changing')
      cableImage.addEventListener('load', revealImage, {once:true})
      cableImage.src = image.src
      cableImage.alt = image.alt
      if (cableImage.complete) requestAnimationFrame(revealImage)
    }

    function update({trackChange = false} = {}) {
      const item = selectedCable()
      if (!item) return
      const requestedMeters = Math.max(1, Math.floor(Number(meters.value) || 1))
      meters.value = requestedMeters
      const text = reference(item)
      updateImage(item)
      result.textContent = text
      info.textContent = item.construction === 'armada'
        ? 'Cable para exteriores con armadura de acero corrugado, protección contra roedores y alta resistencia mecánica.'
        : 'Cable no metálico para uso interior y exterior, con miembros de fuerza de hilo de vidrio y cubierta PE o LSZH.'
      datasheet.href = `/docs/fichas-tecnicas/cable-fibra/${item.slug}.pdf`
      datasheet.dataset.reference = text
      whatsapp.href = `https://wa.me/573134991444?text=${encodeURIComponent(`Hola, quiero cotizar:\n${text}\nCantidad: ${requestedMeters} metros`)}`
      whatsapp.dataset.line = 'cablefo'
      whatsapp.dataset.reference = `${text} - ${requestedMeters} m`
      history.replaceState({}, '', selectedPath(item))
      if (trackChange) track('selector_change', {line:'cablefo', reference:text, metadata:{meters:requestedMeters, configurationPath:selectedPath(item)}})
    }

    family.addEventListener('change', () => { loadConstruction(); loadFiber(); loadCount(); update({trackChange:true}) })
    construction.addEventListener('change', () => { loadFiber(); loadCount(); update({trackChange:true}) })
    fiber.addEventListener('change', () => { loadCount(); update({trackChange:true}) })
    count.addEventListener('change', () => update({trackChange:true}))
    meters.addEventListener('input', () => update())
    meters.addEventListener('change', () => update({trackChange:true}))
    datasheet.addEventListener('click', () => track('datasheet_download', {line:'cablefo', reference:result.textContent}))
    copyLink.addEventListener('click', async () => {
      const url = new URL(selectedPath(), location.origin).href
      try {
        await navigator.clipboard.writeText(url)
        copyLink.textContent = '✓ Enlace copiado'
        track('configuration_url_copied', {line:'cablefo', reference:result.textContent, metadata:{configurationPath:selectedPath()}})
        setTimeout(() => { copyLink.textContent = 'Copiar enlace de esta referencia' }, 1800)
      } catch { window.prompt('Copia este enlace:', url) }
    })

    if (initial.family) family.value = initial.family
    loadConstruction()
    if (initial.construction) construction.value = initial.construction
    loadFiber()
    if (initial.fiber) fiber.value = initial.fiber
    loadCount()
    if (initial.count) count.value = String(initial.count)
    if (initial.meters) meters.value = String(initial.meters)
    update()
  }, 0)
}
