import { renderSpeednetExperience } from "../integrations/speednet.js?v=20260810-3";

export function renderMc(container) {
  container.innerHTML = `
    <div class="expansion-panel expansion-panel--integrated">
      <div class="expansion-content">
        <div class="expansion-header">
          <div>
            <span class="expansion-eyebrow">Speednet · Selección asistida</span>
            <h2>Media Converters</h2>
          </div>
          <button class="expansion-back" type="button">← Volver</button>
        </div>
        <p class="expansion-intro">
          Encuentra el conversor adecuado por interfaz, tipo de fibra y alcance sin abandonar Fiber Electronics.
        </p>
        ${renderSpeednetExperience({
          journey: "mc",
          whatsappUrl: "https://wa.me/573134991444?text=Hola,%20estoy%20interesado%20en%20media%20converters%20fibra%20a%20ethernet.%20¿Me%20puedes%20ayudar%20con%20una%20cotización?"
        })}
      </div>
    </div>
  `;
}
