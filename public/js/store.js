// Guarda el progreso en el propio móvil (localStorage) para no perder el diálogo
// si se recarga la página. Si el navegador lo bloquea, la app funciona igual.
const CLAVE = 'dialogo-socratico:v1';

export function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    if (datos && typeof datos === 'object') return { nombre: '', conversaciones: {}, marcas: false, ...datos };
  } catch {
    /* almacenamiento no disponible */
  }
  return { nombre: '', conversaciones: {}, marcas: false };
}

export function guardar(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    /* almacenamiento no disponible */
  }
}
