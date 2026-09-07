import { track } from '../analytics.js';

const SPEEDNET_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://127.0.0.1:8765/"
  : "https://www.speednetfo.com/";

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

function embeddedJourneyUrl(journey) {
  const url = new URL(journeyUrl(journey));
  url.searchParams.set("embed", "1");
  url.searchParams.set("source", "fibersas");
  return url.toString();
}

export function renderSpeednetExperience({journey, whatsappUrl}) {
  const config = JOURNEYS[journey];
  if (!config) return "";

  track('outbound_tool', {line:journey, metadata:{destination:'speednetfo.com', journey}});
  return `
    <div class="speednet-embed" data-speednet-journey="${journey}">
      <iframe
        src="${embeddedJourneyUrl(journey)}"
        title="${config.label}"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
      ></iframe>
    </div>
    <div class="integration-actions">
      <a class="btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
        ¿Necesitas ayuda? Cotizar por WhatsApp
      </a>
    </div>
  `;
}
