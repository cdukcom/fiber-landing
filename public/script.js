// Año en el footer
document.getElementById("y").textContent = new Date().getFullYear();

// Asegurar autoplay en algunos navegadores
const v = document.getElementById("heroVideo");
if (v) {
  v.muted = true;
  v.setAttribute("muted", "");
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  const p = v.play();
  if (p && typeof p.then === "function") {
    p.catch(() => v.setAttribute("controls", "")); // si bloquean autoplay, muestra controles
  }
}