// Utilidades de interfaz: escape, fechas, estados de carga/error y avisos.
export const esc = (texto) => String(texto ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const ZONA = 'America/Bogota';
const valida = (iso) => iso && !Number.isNaN(new Date(iso).getTime());

export const fechaLarga = (iso) => (valida(iso)
  ? new Date(iso).toLocaleDateString('es-CO', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long' })
  : '');
export const fechaCorta = (iso) => (valida(iso)
  ? new Date(iso).toLocaleDateString('es-CO', { timeZone: ZONA, weekday: 'short', day: 'numeric', month: 'short' })
  : '');
export const horaDe = (iso) => (valida(iso)
  ? new Date(iso).toLocaleTimeString('es-CO', { timeZone: ZONA, hour: 'numeric', minute: '2-digit' })
  : '');

const CLAVES = { 'Natación': 'natacion', Atletismo: 'atletismo', Ciclismo: 'ciclismo', Karate: 'karate', CrossFit: 'crossfit' };
export const claveDisciplina = (categoria) => CLAVES[categoria] || 'todas';

export function estadoCarga(texto, conDorsales = false) {
  const fantasmas = conDorsales
    ? `<div class="rejilla" aria-hidden="true">${'<div class="dorsal dorsal-fantasma"></div>'.repeat(6)}</div>`
    : '';
  return `<p class="cargando" role="status">${esc(texto)}</p>${fantasmas}`;
}

export function estadoError(mensaje) {
  return `<div class="error-bloque" role="alert">
      <p>${esc(mensaje)}</p>
      <button class="boton boton-borde" type="button" data-reintentar>Intentar de nuevo</button>
    </div>`;
}

// Deshabilita un botón mientras dura una petición. Devuelve la función que lo restaura.
export function ocupado(boton, texto) {
  const original = boton.textContent;
  boton.disabled = true;
  boton.setAttribute('aria-busy', 'true');
  boton.textContent = texto;
  return () => {
    boton.disabled = false;
    boton.removeAttribute('aria-busy');
    boton.textContent = original;
  };
}

let temporizadorAviso;
export function avisar(mensaje, tipo = 'ok') {
  const caja = document.getElementById('aviso');
  caja.textContent = mensaje;
  caja.dataset.tipo = tipo;
  caja.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { caja.hidden = true; }, 6000);
}
