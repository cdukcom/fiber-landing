// js/expansions/rack.js

export function renderRack(container) {
  container.innerHTML = `
    <div class="expansion-panel">
      <img src="./img/fo/rack.png" alt="Racks y Gabinetes">

      <div class="expansion-content">

        <div class="expansion-header">
          <h2>Racks y Gabinetes</h2>
          <div class="expansion-back">← Volver</div>
        </div>

        <p>
          Soluciones versátiles para montaje, protección y organización de equipos de red,
          diseñadas para instalaciones residenciales, corporativas e industriales.
        </p>

        <p>
          Contamos con una alta rotación de gabinetes interiores en formatos compactos,
          ideales para telecomunicaciones, CCTV y redes estructuradas.
        </p>

        <ul>
          <li>Gabinetes interiores de 5U, 7U, 9U y 11U</li>
          <li>Gabinetes exteriores tipo intemperie (50×40×25 cm y similares)</li>
          <li>Racks abiertos y gabinetes completos para servidores (bajo pedido)</li>
          <li>Bandejas ventiladas de 20, 25 y 30 cm</li>
          <li>Tornillería y accesorios para instalación en rack</li>
        </ul>

        <p>
          Esta línea es altamente demandada por su facilidad de instalación, robustez y
          compatibilidad con múltiples equipos activos y pasivos, permitiendo soluciones
          ordenadas y profesionales en cualquier tipo de proyecto.
        </p>

        <a 
          href="https://wa.me/573134991444?text=Hola,%20estoy%20interesado%20en%20racks%20y%20gabinetes%20para%20redes.%20¿Me%20puedes%20ayudar%20con%20una%20cotización?"
          target="_blank"
          class="btn-whatsapp"
        >
          Cotizar por WhatsApp
        </a>

      </div>
    </div>
  `
}

