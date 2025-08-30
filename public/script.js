// Año en el footer
document.getElementById("y").textContent = new Date().getFullYear();

// Lazy-load del video con fallback robusto
(function () {
  const v = document.getElementById("heroVideo");
  if (!v) return;

  const MP4_SRC = "/media/video.mp4";

  function loadAndPlay() {
    // Asegurar flags para autoplay mobile
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");

    // Cargar fuente (solo MP4 en tu repo)
    if (v.src !== location.origin + MP4_SRC) {
      v.src = MP4_SRC;
    }
    // Forzar carga y reproducir
    v.load();
    const p = v.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        // ok
      }).catch(() => {
        // Si el navegador bloquea autoplay, mostrar controles
        v.setAttribute("controls", "");
      });
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
    // Sin IO: cargar directo
    loadAndPlay();
  }
})();