// Sesión del navegador. Solo guarda el token que entrega n8n (WF02); n8n decide si sigue siendo válido.
const CLAVE = 'eventpass.sesion';
const CLAVE_VISITANTE = 'eventpass.visitante';

const leer = (clave) => {
  try {
    return JSON.parse(localStorage.getItem(clave));
  } catch {
    return null;
  }
};
const escribir = (clave, valor) => {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Navegación privada o almacenamiento bloqueado: la sesión dura lo que dure la pestaña.
  }
};

let enMemoria = leer(CLAVE);

export const sesion = {
  destino: '',
  datos: () => enMemoria,
  activa: () => Boolean(enMemoria?.token && new Date(enMemoria.expira_en).getTime() > Date.now()),
  token: () => enMemoria?.token || '',
  usuario: () => enMemoria?.usuario || { nombre: '' },
  guardar(datos) {
    enMemoria = datos;
    escribir(CLAVE, datos);
  },
  limpiar() {
    enMemoria = null;
    escribir(CLAVE, null);
  },
};

// Identificador anónimo y estable del navegador, para el log del catálogo y el asistente.
export function visitorId() {
  let id = leer(CLAVE_VISITANTE);
  if (!id) {
    id = 'VIS-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    escribir(CLAVE_VISITANTE, id);
  }
  return id;
}
