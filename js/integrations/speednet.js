const SPEEDNET_BASE_URL = "https://www.speednetfo.com/";

const JOURNEYS = {
  sfp: {
    campaign: "speednet_sfp",
    label: "Seleccionar y diseñar en SpeednetFO"
  },
  mc: {
    campaign: "speednet_mc",
    label: "Encontrar mi Media Converter"
  }
};

function journeyUrl(journey) {
  const config = JOURNEYS[journey];
  const url = new URL(SPEEDNET_BASE_URL);
  url.searchParams.set("journey", journey);
  url.searchParams.set("utm_source", "fibersas");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", config.campaign);
  return url.toString();
}

export function renderSpeednetActions({journey, whatsappUrl}) {
  const config = JOURNEYS[journey];
  if (!config) return "";

  return `
    <div class="integration-actions">
      <a class="btn-speednet" href="${journeyUrl(journey)}" target="_blank" rel="noopener">
        <span>${config.label}</span>
        <small>Herramienta especializada · abre en una pestaña nueva</small>
      </a>
      <a class="btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener">
        Cotizar directamente por WhatsApp
      </a>
    </div>
  `;
}
