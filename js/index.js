// js/index.js

// ============================
// IMPORTS (11 módulos)
// ============================

import { renderPatchcord } from './expansions/patchcord.js'
import { renderOdf } from './expansions/odf.js'
import { renderRack } from './expansions/rack.js'
import { renderCableado } from './expansions/cableado.js'
import { renderCablefo } from './expansions/cablefo.js'
import { renderCajaob } from './expansions/cajaob.js'
import { renderCableext } from './expansions/cableext.js'
import { renderHerramientas } from './expansions/herramientas.js'

import { renderSwitch } from './expansions/switch.js'
import { renderMc } from './expansions/mc.js'
import { renderSfp } from './expansions/sfp.js'

function addFiberOrigin(urlValue) {
  try {
    const url = new URL(urlValue, window.location.href)
    if (!url.hostname.endsWith('wa.me')) return urlValue

    const message = url.searchParams.get('text')?.trim() || ''
    if (!message.includes('Origen: fibersas.com')) {
      url.searchParams.set('text', `${message}\n\nOrigen: fibersas.com`.trim())
    }
    return url.toString()
  } catch {
    return urlValue
  }
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href*="wa.me/"]')
  if (!link) return
  link.href = addFiberOrigin(link.href)
})

// ============================
// MAPA
// ============================

const renderMap = {
  patchcord: renderPatchcord,
  odf: renderOdf,
  rack: renderRack,
  cableado: renderCableado,
  cablefo: renderCablefo,
  cajaob: renderCajaob,
  cableext: renderCableext,
  herramientas: renderHerramientas,
  switch: renderSwitch,
  mc: renderMc,
  sfp: renderSfp
}

// ============================
// DOM
// ============================

const fiberGrid = document.getElementById('fiber-grid')
const fiberExpansion = document.getElementById('fiber-expansion')

const activeGrid = document.getElementById('active-grid')
const activeExpansion = document.getElementById('active-expansion')

// ============================
// CORE
// ============================

function openExpansion(container, grid, renderFn, card) {

  // animar grid
  grid.classList.add('fade-out')

  // destacar card
  card.classList.add('active-card')

  setTimeout(() => {

    grid.style.display = 'none'

    container.innerHTML = ''
    renderFn(container)

    container.classList.add('active')

    const backBtn = container.querySelector('.expansion-back')

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        closeExpansion(container, grid)
      })
    }

  }, 200)
}

// ============================
// GLOBAL CLOSE
// ============================

function closeExpansion(container, grid) {

  container.classList.remove('active')
  container.innerHTML = ''

  grid.style.display = 'grid'

  setTimeout(() => {
    grid.classList.remove('fade-out')
  }, 10)

  // quitar estado de cards
  document.querySelectorAll('.card').forEach(c => {
    c.classList.remove('active-card')
  })
}

// ============================
// EVENTOS
// ============================

document.querySelectorAll('.card').forEach(card => {
  const activate = () => {

    const key = card.dataset.link
    const renderFn = renderMap[key]

    if (!renderFn) return

    let container, grid

    if (card.closest('#fibra')) {
      container = fiberExpansion
      grid = fiberGrid
    } else {
      container = activeExpansion
      grid = activeGrid
    }

    openExpansion(container, grid, renderFn, card)

  }

  card.addEventListener('click', activate)
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate()
    }
  })

})
