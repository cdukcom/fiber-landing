const container = document.querySelector('#popular-configurations')
if (container) {
  fetch('/api/popular-configurations')
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(({items}) => {
      container.innerHTML = items.map(item => `<a class="card" href="${item.path}"><h3>${item.label}</h3><p>Abrir configuración</p></a>`).join('')
    })
    .catch(() => { container.closest('section').hidden = true })
}
