document.addEventListener('DOMContentLoaded', () => {
    const edificioSelect = document.getElementById('edificio');
    const aulaSelect = document.getElementById('aula');
    const tipoIncidenciaSelect = document.getElementById('tipo');
  
    // Cargar los edificios al cargar la página
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
  
    // Cargar las aulas cuando se seleccione un edificio
    edificioSelect.addEventListener('change', () => {
      const edificio = edificioSelect.value;
  
      // Limpia las aulas previas
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
  
    // Cargar los tipos de incidencia (puedes definir más opciones aquí)
    const tiposIncidencia = [
      'Falla de proyector',
      'Falla de mouse',
      'No hay internet',
      'Otra opción',
    ];
  
    tiposIncidencia.forEach((tipo) => {
      const option = document.createElement('option');
      option.value = tipo;
      option.textContent = tipo;
      tipoIncidenciaSelect.appendChild(option);
    });
  });
  