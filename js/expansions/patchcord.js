// js/expansions/patchcord.js

// =========================
// MODELO DE PRODUCTO
// =========================

const FIBERS = {
  MULTIMODO: ['OM2', 'OM3', 'OM4'],
  MONOMODO: ['OS2']
}

const LENGTHS = [1,2,3,5,10,15,20,25,40,50,80,100]

// =========================
// RENDER
// =========================

export function renderPatchcord(container) {

  container.innerHTML = `
    <div class="expansion-panel">

      <!-- VISUAL -->
      <div class="pc-visual">
        <img id="pc-image" src="/img/patchcord-types/om3.png" class="pc-image"/>
      </div>

      <div class="expansion-content">

        <div class="expansion-header">
          <h2>Patch Cord Fibra Óptica</h2>
          <div class="expansion-back">← Volver</div>
        </div>

        <!-- FORM -->
        <div class="pc-form">

          <label>Familia</label>
          <select id="pc-family">
            <option value="MM">Multimodo</option>
            <option value="SM">Monomodo</option>
          </select>

          <label>Tipo de fibra</label>
          <select id="pc-subtype"></select>

          <label>Configuración</label>
          <select id="pc-mode">
            <option>Duplex</option>
            <option>Simplex</option>
          </select>

          <label>Conector A</label>
          <select id="pc-conn-a">
            <option>LC</option>
            <option>SC</option>
            <option>ST</option>
            <option>FC</option>
          </select>

          <label>Conector B</label>
          <select id="pc-conn-b">
            <option>LC</option>
            <option>SC</option>
            <option>ST</option>
            <option>FC</option>
          </select>

          <label>Longitud (metros)</label>
          <select id="pc-length">
            ${LENGTHS.map(l => `<option>${l}</option>`).join('')}
          </select>

        </div>

        <div id="pc-result" class="pc-result"></div>

        <div id="pc-info" class="pc-info"></div>

        <div class="pc-legend">
          Dale click al botón de WhatsApp para que te ayudemos con la cotización.
        </div>

        <a id="pc-whatsapp" target="_blank" class="btn-whatsapp">
          Cotizar por WhatsApp
        </a>

        <button class="btn-disabled">
          Agregar a BOMaker (próximamente)
        </button>

      </div>

    </div>
  `

  // =========================
  // LÓGICA
  // =========================

  setTimeout(() => {

    const family = container.querySelector('#pc-family')
    const subtype = container.querySelector('#pc-subtype')
    const mode = container.querySelector('#pc-mode')
    const connA = container.querySelector('#pc-conn-a')
    const connB = container.querySelector('#pc-conn-b')
    const length = container.querySelector('#pc-length')

    const result = container.querySelector('#pc-result')
    const info = container.querySelector('#pc-info')
    const btn = container.querySelector('#pc-whatsapp')
    const img = container.querySelector('#pc-image')

    // =========================
    // SUBTIPOS
    // =========================

    function loadSubtypes() {
      const list = family.value === 'MM'
        ? FIBERS.MULTIMODO
        : FIBERS.MONOMODO

      subtype.innerHTML = list.map(v => `<option>${v}</option>`).join('')
    }

    // =========================
    // CAMBIO DE IMAGEN
    // =========================

    function updateImage() {
      const type = subtype.value.toLowerCase()
      img.src = `/img/patchcord-types/${type}.png`
    }

    // =========================
    // INFO EDUCATIVA
    // =========================

    function buildInfo() {
      let text = ''

      if (subtype.value === 'OM2')
        text = 'Fibra multimodo tradicional, utilizada en redes de menor velocidad.'

      if (subtype.value === 'OM3')
        text = 'OM3 es fibra optimizada para láser, ideal para redes de alta velocidad y centros de datos.'

      if (subtype.value === 'OM4')
        text = 'OM4 permite mayores distancias y mejor rendimiento en enlaces de 10G, 40G y 100G.'

      if (subtype.value === 'OS2')
        text = 'OS2 es fibra monomodo para largas distancias, ideal para backbone y exteriores.'

      info.innerText = text
    }

    // =========================
    // UPDATE GENERAL
    // =========================

    function update() {

      updateImage()

      const text = `Patch Cord ${subtype.value} ${mode.value} ${connA.value}-${connB.value} ${length.value}m`

      result.innerText = text

      const message = encodeURIComponent(`Hola, quiero cotizar:\n${text}`)
      btn.href = `https://wa.me/573134991444?text=${message}`

      buildInfo()
    }

    // =========================
    // EVENTOS
    // =========================

    family.addEventListener('change', () => {
      loadSubtypes()
      update()
    })

    ;[subtype, mode, connA, connB, length].forEach(el => {
      el.addEventListener('change', update)
    })

    loadSubtypes()
    update()

  }, 0)
}
