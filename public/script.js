// Mostrar año actual en el footer
document.getElementById("y").textContent = new Date().getFullYear();

// Opcional: Si quieres que el video siempre empiece a reproducirse
const v = document.getElementById("heroVideo");
if (v) {
  v.play().catch(() => {
    // Algunos navegadores bloquean autoplay si no está silenciado
    v.muted = true;
    v.play().catch(() => {}); 
  });
}