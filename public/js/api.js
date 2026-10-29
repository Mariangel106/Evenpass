// Cliente HTTP de EventPass. La web nunca habla con Google Sheets: todo pasa por los webhooks de n8n.
const config = window.EVENTPASS_CONFIG || {};
const BASE = String(config.N8N_BASE_URL || '').replace(/\/+$/, '');
const TIEMPO_MAXIMO_MS = 25000;

export class ErrorApi extends Error {
  constructor(mensaje, status = 0, datos = null) {
    super(mensaje);
    this.status = status;
    this.datos = datos;
  }
}

async function solicitar(url, opciones = {}) {
  if (!BASE && !url.startsWith('http')) {
    throw new ErrorApi('Falta configurar la URL de n8n (EP_N8N_BASE_URL) en el despliegue.');
  }
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  let respuesta;
  // ngrok gratuito muestra una página de aviso a los navegadores; este encabezado la omite.
  const headers = { 'ngrok-skip-browser-warning': '1', ...(opciones.headers || {}) };
  try {
    respuesta = await fetch(url, { ...opciones, headers, signal: control.signal });
  } catch (e) {
    const mensaje = e.name === 'AbortError'
      ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
      : 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
    throw new ErrorApi(mensaje);
  } finally {
    clearTimeout(temporizador);
  }
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // n8n puede responder sin cuerpo si el workflow está inactivo.
  }
  if (!respuesta.ok || (datos && datos.ok === false)) {
    const mensaje = (datos && datos.error)
      || (respuesta.status === 404 ? 'El servicio no está disponible. ¿Está activo el workflow en n8n?' : `Error del servidor (${respuesta.status}).`);
    throw new ErrorApi(mensaje, respuesta.status, datos);
  }
  return datos || {};
}

const post = (ruta, cuerpo) => solicitar(`${BASE}${ruta}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo),
});

export const api = {
  usuarios: (cuerpo) => post('/ep/usuarios', cuerpo),
  auth: (cuerpo) => post('/ep/auth', cuerpo),
  codigoTelegram: (session_token) => post('/ep/telegram/codigo', { session_token }),
  inscripciones: (cuerpo) => post('/ep/inscripciones', cuerpo),
  checkin: (cuerpo) => post('/ep/checkin', cuerpo),
  catalogo: (parametros) => {
    const q = new URLSearchParams(Object.entries(parametros).filter(([, v]) => v));
    return solicitar(`${BASE}/ep/catalogo?${q}`);
  },
  chat: (sessionId, chatInput, metadata) => {
    if (!config.CHAT_URL) throw new ErrorApi('El asistente aún no está configurado (EP_CHAT_URL).');
    return solicitar(config.CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput, metadata, ...metadata }),
    });
  },
};

export const telegramBot = String(config.TELEGRAM_BOT || '').replace(/^@/, '');
