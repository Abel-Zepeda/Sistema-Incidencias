document.addEventListener('DOMContentLoaded', () => {
    const edificioSelect = document.getElementById('edificio');
    const aulaSelect = document.getElementById('aula');
  
    // Cargar edificios
    fetch('/api/edificios')
      .then((response) => response.json())
      .then((edificios) => {
        edificios.forEach((edificio) => {
          const option = document.createElement('option');
          option.value = edificio.edificio;
          option.textContent = edificio.edificio;
          edificioSelect.appendChild(option);
        });
      })
      .catch((error) => console.error('Error al cargar edificios:', error));
  
    // Cargar aulas
    edificioSelect.addEventListener('change', () => {
      const edificio = edificioSelect.value;
  
      aulaSelect.innerHTML = '<option value="">Seleccione un aula</option>';
      if (edificio) {
        fetch(`/api/aulas/${edificio}`)
          .then((response) => response.json())
          .then((aulas) => {
            aulas.forEach((aula) => {
              const option = document.createElement('option');
              option.value = aula.aula;
              option.textContent = aula.aula;
              aulaSelect.appendChild(option);
            });
          })
          .catch((error) => console.error('Error al cargar aulas:', error));
      }
    });
  });
  