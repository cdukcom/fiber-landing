import { renderSpeednetExperience } from "../integrations/speednet.js?v=20260810-3";

export function renderSfp(container) {
  container.innerHTML = `
    <div class="expansion-panel expansion-panel--integrated">
      <div class="expansion-content">
        <div class="expansion-header">
          <div>
            <span class="expansion-eyebrow">Speednet · Selección asistida</span>
            <h2>SFP y transceptores ópticos</h2>
          </div>
          <button class="expansion-back" type="button">← Volver</button>
        </div>
        <p class="expansion-intro">
          Selecciona velocidad, fibra, número de hilos y distancia sin abandonar Fiber Electronics.
        </p>
        ${renderSpeednetExperience({
          journey: "sfp",
          whatsappUrl: "https://wa.me/573134991444?text=Hola,%20estoy%20interesado%20en%20transceivers%20SFP%20y%20soluciones%20ópticas.%20¿Me%20puedes%20ayudar%20con%20una%20cotización?"
        })}
      </div>
    </div>
  `;
}
