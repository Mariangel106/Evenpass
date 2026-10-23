// Widget del asistente (WF10). Envía cada mensaje al Chat Trigger de n8n.
// n8n genera el conversation_id en el primer mensaje; la web lo reutiliza como sessionId.
import { api } from './api.js';
import { sesion, visitorId } from './sesion.js';
import { esc } from './ui.js';

const CLAVE = 'eventpass.conversacion';

export function iniciarChat() {
  const abrir = document.getElementById('chat-abrir');
  const panel = document.getElementById('chat-panel');
  const cerrar = document.getElementById('chat-cerrar');
  const lista = document.getElementById('chat-mensajes');
  const form = document.getElementById('chat-form');
  const campo = document.getElementById('chat-texto');
  let conversacion = leerConversacion();

  const agregar = (rol, texto) => {
    const li = document.createElement('li');
    li.className = `msj msj-${rol}`;
    li.innerHTML = esc(texto).replace(/\n/g, '<br>');
    lista.append(li);
    lista.scrollTop = lista.scrollHeight;
    return li;
  };

  const alternar = (abierto) => {
    panel.hidden = !abierto;
    abrir.hidden = abierto;
    abrir.setAttribute('aria-expanded', String(abierto));
    if (abierto) {
      if (!lista.children.length) {
        agregar('asistente', 'Hola. Puedo contarte qué eventos hay, cuántos cupos quedan, cómo funciona la lista de espera o cómo vincular Telegram.');
      }
      campo.focus();
    } else {
      abrir.focus();
    }
  };
  abrir.addEventListener('click', () => alternar(true));
  cerrar.addEventListener('click', () => alternar(false));
  panel.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') alternar(false); });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;
    campo.value = '';
    agregar('usuario', texto);
    const pensando = agregar('asistente', 'Escribiendo…');
    pensando.classList.add('msj-cargando');
    const boton = form.querySelector('button');
    boton.disabled = campo.disabled = true;
    try {
      const r = await api.chat(conversacion || `nueva-${visitorId()}`, texto, {
        usuario_id: sesion.activa() ? sesion.usuario().usuario_id : '',
        visitor_id: visitorId(),
      });
      if (r.conversation_id && r.conversation_id !== conversacion) {
        conversacion = r.conversation_id;
        guardarConversacion(conversacion);
      }
      pensando.classList.remove('msj-cargando');
      pensando.innerHTML = esc(r.output || 'No recibí respuesta. Intenta de nuevo.').replace(/\n/g, '<br>');
    } catch (error) {
      pensando.classList.remove('msj-cargando');
      pensando.classList.add('msj-error');
      pensando.textContent = error.message;
    } finally {
      boton.disabled = campo.disabled = false;
      campo.focus();
    }
  });
}

function leerConversacion() {
  try {
    return sessionStorage.getItem(CLAVE) || '';
  } catch {
    return '';
  }
}
function guardarConversacion(id) {
  try {
    sessionStorage.setItem(CLAVE, id);
  } catch {
    // Sin almacenamiento la conversación sigue mientras la pestaña esté abierta.
  }
}
