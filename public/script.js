// Año en el footer
document.getElementById("y").textContent = new Date().getFullYear();

// Lazy-load del video con fallback robusto
(function () {
  const v = document.getElementById("heroVideo");
  if (!v) return;

  // 👇 Usa el nombre real del archivo que subiste
  const MP4_SRC = "/media/video_hero_12s.mp4";

  function loadAndPlay() {
    // Asegurar flags para autoplay mobile
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");

    // Cargar fuente
    if (v.src !== location.origin + MP4_SRC) {
      v.src = MP4_SRC;
    }
    v.load();

    const p = v.play();
    if (p && typeof p.then === "function") {
      p.catch(() => v.setAttribute("controls", "")); // si bloquean autoplay, muestra controles
    }
  }

  // Lazy con IntersectionObserver
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          loadAndPlay();
          io.disconnect();
        }
      });
    }, { rootMargin: "200px 0px", threshold: 0.1 });
    io.observe(v);
  } else {
    loadAndPlay();
  }
})();