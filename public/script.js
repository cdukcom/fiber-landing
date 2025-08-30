document.getElementById("y").textContent = new Date().getFullYear();

const v = document.getElementById("heroVideo");
function setVideoSrc(url) {
  const source = v.querySelector("source") || document.createElement("source");
  source.src = url;
  source.type = "video/mp4";
  if (!source.parentNode) v.appendChild(source);
  v.load();
}

if (v) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !v.dataset.loaded) {
          setVideoSrc("/media/video.mp4");   // usa tu archivo real
          v.dataset.loaded = "1";
          io.disconnect();
        }
      });
    }, { rootMargin: "200px" });
    io.observe(v);
  } else {
    setVideoSrc("/media/video.mp4");
  }
}