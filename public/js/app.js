import { api, ErrorApi, telegramBot } from './api.js';
import { iniciarChat } from './chat.js';
import { sesion, visitorId } from './sesion.js';
import { esc, fechaLarga, fechaCorta, horaDe, claveDisciplina, avisar, estadoCarga, estadoError, ocupado } from './ui.js';

const main = document.getElementById('contenido');
const nav = document.getElementById('nav');

// ---------------------------------------------------------------------------
// Enrutador por hash: #/  #/evento/ID  #/ingresar  #/registro  #/perfil  #/mis-inscripciones
// ---------------------------------------------------------------------------
const rutas = [
  [/^#?\/?$/, vistaAgenda],
  [/^#\/evento\/([\w-]+)$/, vistaEvento],
  [/^#\/ingresar$/, vistaIngresar],
  [/^#\/registro$/, vistaRegistro],
  [/^#\/perfil$/, vistaPerfil, true],
  [/^#\/mis-inscripciones$/, vistaInscripciones, true],
];

async function navegar() {
  const hash = location.hash || '#/';
  pintarNav();
  for (const [patron, vista, privada] of rutas) {
    const m = hash.match(patron);
    if (!m) continue;
    if (privada && !sesion.activa()) {
      sesion.destino = hash;
      location.hash = '#/ingresar';
      return;
    }
    window.scrollTo(0, 0);
    await vista(...m.slice(1));
    main.focus({ preventScroll: true });
    return;
  }
  main.innerHTML = `<section class="pagina"><h1 class="titulo">No encontramos esta página</h1><p><a class="enlace" href="#/">Volver a la agenda</a></p></section>`;
}

function pintarNav() {
  const actual = location.hash || '#/';
  const enlace = (href, texto) => `<a href="${href}"${actual === href ? ' aria-current="page"' : ''}>${texto}</a>`;
  nav.innerHTML = sesion.activa()
    ? `${enlace('#/', 'Agenda')}${enlace('#/mis-inscripciones', 'Mis inscripciones')}${enlace('#/perfil', esc(sesion.usuario().nombre.split(' ')[0]))}
       <button type="button" class="nav-salir" id="salir">Salir</button>`
    : `${enlace('#/', 'Agenda')}${enlace('#/ingresar', 'Ingresar')}<a class="nav-cta" href="#/registro">Crear cuenta</a>`;
  document.getElementById('salir')?.addEventListener('click', cerrarSesion);
}

async function cerrarSesion() {
  const token = sesion.token();
  sesion.limpiar();
  location.hash = '#/';
  pintarNav();
  avisar('Cerraste sesión.');
  try {
    await api.auth({ accion: 'logout', session_token: token });
  } catch {
    // La sesión local ya se borró; si n8n no responde, la sesión expira sola.
  }
}

// Si el servidor dice que la sesión ya no sirve, se limpia y se pide ingresar de nuevo.
function manejarSesionVencida(error) {
  if (error instanceof ErrorApi && (error.status === 401 || error.status === 403) && sesion.activa()) {
    sesion.limpiar();
    sesion.destino = location.hash;
    avisar(error.message, 'error');
    location.hash = '#/ingresar';
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Dorsal: la tarjeta de cada evento. El número grande son los cupos libres.
// ---------------------------------------------------------------------------
const TEXTO_DISPONIBILIDAD = {
  DISPONIBLE: (e) => `cupos libres de ${e.capacidad}`,
  LLENO: (e) => (e.lista_espera ? `Lleno · ${e.lista_espera} en lista de espera` : 'Lleno · lista de espera abierta'),
  CANCELADO: () => 'Evento cancelado',
  CERRADO: () => 'Inscripciones cerradas',
  FINALIZADO: () => 'Evento finalizado',
};

function dorsal(e, { destacado = false } = {}) {
  const numero = ['DISPONIBLE', 'LLENO'].includes(e.disponibilidad) ? e.cupos_disponibles : '—';
  const sello = { CANCELADO: 'Cancelado', CERRADO: 'Cerrado', FINALIZADO: 'Finalizado' }[e.disponibilidad];
  return `
    <article class="dorsal${destacado ? ' dorsal-destacado' : ''}${sello ? ' dorsal-inactivo' : ''}" data-disciplina="${claveDisciplina(e.categoria)}">
      <p class="dorsal-franja"><span>${esc(e.categoria)}</span><span>${esc(e.grupo_edad)}</span></p>
      <div class="dorsal-cuerpo">
        <p class="dorsal-numero" aria-hidden="true">${numero}</p>
        <p class="dorsal-leyenda">${esc(TEXTO_DISPONIBILIDAD[e.disponibilidad]?.(e) || e.disponibilidad)}</p>
        <h3 class="dorsal-nombre"><a href="#/evento/${esc(e.evento_id)}">${esc(e.nombre)}</a></h3>
        <p class="dorsal-dato"><time datetime="${esc(e.inicio)}">${esc(fechaCorta(e.inicio))} · ${esc(horaDe(e.inicio))}</time></p>
        <p class="dorsal-dato">${esc(e.lugar)}</p>
        ${e.motivo_estado ? `<p class="dorsal-motivo">${esc(e.motivo_estado)}</p>` : ''}
      </div>
      ${sello ? `<p class="dorsal-sello" aria-hidden="true">${sello}</p>` : ''}
      <span class="oculto">${numero === '—' ? '' : `${numero} cupos libres de ${e.capacidad}.`}</span>
    </article>`;
}

// ---------------------------------------------------------------------------
// Agenda (catálogo público)
// ---------------------------------------------------------------------------
const DISCIPLINAS = ['Natación', 'Atletismo', 'Ciclismo', 'Karate', 'CrossFit'];
const filtros = { categoria: '', grupo_edad: '' };

async function vistaAgenda() {
  main.innerHTML = `
    <section class="portada">
      <div class="portada-texto">
        <h1 class="titulo-portada">Elige la prueba, asegura tu dorsal.</h1>
        <p class="portada-bajada">Natación, atletismo, ciclismo, karate y CrossFit en Santander. Cada disciplina tiene un evento para
          adultos y otro para niños, con 10 cupos. Si se llena, entras a la lista de espera y te avisamos cuando se libere un cupo.</p>
      </div>
      <div class="portada-proximo" id="proximo" aria-live="polite"></div>
    </section>
    <section class="agenda" aria-labelledby="titulo-agenda">
      <div class="agenda-cabecera">
        <h2 id="titulo-agenda" class="titulo">Agenda</h2>
        <form class="filtros" id="filtros" aria-label="Filtrar eventos">
          <fieldset class="filtro-grupo">
            <legend class="oculto">Disciplina</legend>
            ${['', ...DISCIPLINAS].map((d) => `
              <label class="chip" data-disciplina="${claveDisciplina(d)}">
                <input type="radio" name="categoria" value="${d}"${filtros.categoria === d ? ' checked' : ''} />
                <span>${d || 'Todas'}</span>
              </label>`).join('')}
          </fieldset>
          <fieldset class="filtro-grupo filtro-edad">
            <legend class="oculto">Grupo de edad</legend>
            ${[['', 'Todas las edades'], ['Adultos', 'Adultos'], ['Niños', 'Niños']].map(([v, t]) => `
              <label class="chip chip-edad">
                <input type="radio" name="grupo_edad" value="${v}"${filtros.grupo_edad === v ? ' checked' : ''} />
                <span>${t}</span>
              </label>`).join('')}
          </fieldset>
        </form>
      </div>
      <div id="lista-eventos" aria-live="polite"></div>
    </section>`;

  document.getElementById('filtros').addEventListener('change', (ev) => {
    filtros[ev.target.name] = ev.target.value;
    cargarEventos();
  });
  await cargarEventos(true);
}

async function cargarEventos(primeraVez = false) {
  const lista = document.getElementById('lista-eventos');
  if (!lista) return;
  lista.innerHTML = estadoCarga('Cargando la agenda…', true);
  const filtrado = filtros.categoria || filtros.grupo_edad;
  try {
    const datos = await api.catalogo({
      tipo: filtrado ? 'FILTRO' : 'LISTADO',
      categoria: filtros.categoria,
      grupo_edad: filtros.grupo_edad,
      visitor_id: visitorId(),
    });
    if (primeraVez || !filtrado) pintarProximo(datos.eventos);
    if (datos.eventos.length === 0) {
      lista.innerHTML = `<div class="vacio"><p>No hay eventos con esos filtros.</p>
        <button class="boton boton-borde" type="button" id="quitar-filtros">Ver toda la agenda</button></div>`;
      document.getElementById('quitar-filtros').addEventListener('click', () => {
        filtros.categoria = filtros.grupo_edad = '';
        vistaAgenda();
      });
      return;
    }
    lista.innerHTML = `<div class="rejilla">${datos.eventos.map((e) => dorsal(e)).join('')}</div>`;
  } catch (error) {
    lista.innerHTML = estadoError(error.message);
    lista.querySelector('[data-reintentar]').addEventListener('click', () => cargarEventos(primeraVez));
    const proximo = document.getElementById('proximo');
    if (proximo && primeraVez) proximo.innerHTML = '';
  }
}

function pintarProximo(eventos) {
  const caja = document.getElementById('proximo');
  if (!caja) return;
  const siguiente = eventos.find((e) => e.acepta_inscripciones);
  if (!siguiente) {
    caja.innerHTML = '';
    return;
  }
  caja.innerHTML = `<p class="portada-etiqueta">El próximo en la agenda, ${esc(fechaLarga(siguiente.inicio))}</p>${dorsal(siguiente, { destacado: true })}`;
}

// ---------------------------------------------------------------------------
// Detalle del evento e inscripción
// ---------------------------------------------------------------------------
async function vistaEvento(eventoId) {
  main.innerHTML = `<section class="pagina">${estadoCarga('Cargando el evento…')}</section>`;
  let evento;
  let inscripcion = null;
  let telegramVinculado = null;
  try {
    const consultas = [api.catalogo({ tipo: 'DETALLE', evento_id: eventoId, visitor_id: visitorId() })];
    if (sesion.activa()) consultas.push(api.inscripciones({ accion: 'listar', session_token: sesion.token() }));
    const [detalle, mias] = await Promise.all(consultas);
    evento = detalle.evento;
    if (mias) {
      telegramVinculado = mias.telegram_vinculado;
      inscripcion = mias.inscripciones.find((i) => i.evento_id === evento.evento_id && i.estado !== 'CANCELADA') || null;
    }
  } catch (error) {
    if (manejarSesionVencida(error)) return;
    main.innerHTML = `<section class="pagina">${estadoError(error.message)}<p><a class="enlace" href="#/">Volver a la agenda</a></p></section>`;
    main.querySelector('[data-reintentar]').addEventListener('click', () => vistaEvento(eventoId));
    return;
  }

  main.innerHTML = `
    <section class="pagina detalle" data-disciplina="${claveDisciplina(evento.categoria)}">
      <p class="migas"><a class="enlace" href="#/">Agenda</a> / ${esc(evento.categoria)}</p>
      <div class="detalle-rejilla">
        <div class="detalle-dorsal">${dorsal(evento, { destacado: true })}</div>
        <div class="detalle-info">
          <h1 class="titulo">${esc(evento.nombre)}</h1>
          <p class="detalle-descripcion">${esc(evento.descripcion)}</p>
          <dl class="ficha">
            <div><dt>Cuándo</dt><dd>${esc(fechaLarga(evento.inicio))}, ${esc(horaDe(evento.inicio))}</dd></div>
            <div><dt>Dónde</dt><dd>${esc(evento.lugar)}</dd></div>
            <div><dt>Grupo</dt><dd>${esc(evento.grupo_edad)}</dd></div>
            <div><dt>Organiza</dt><dd>${esc(evento.organizador)}</dd></div>
            <div><dt>Cupos</dt><dd>${evento.inscritos_confirmados} confirmados de ${evento.capacidad}${evento.lista_espera ? `, ${evento.lista_espera} en lista de espera` : ''}</dd></div>
          </dl>
          ${evento.motivo_estado ? `<p class="nota nota-alerta"><strong>${evento.estado === 'CANCELADO' ? 'Cancelado' : 'Aviso'}:</strong> ${esc(evento.motivo_estado)}</p>` : ''}
          <div id="zona-inscripcion">${bloqueInscripcion(evento, inscripcion, telegramVinculado)}</div>
        </div>
      </div>
    </section>`;

  const form = document.getElementById('form-inscripcion');
  form?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const datos = new FormData(form);
    const boton = form.querySelector('button[type=submit]');
    const estado = form.querySelector('.form-estado');
    estado.textContent = '';
    estado.className = 'form-estado';
    const listo = ocupado(boton, 'Inscribiendo…');
    try {
      const r = await api.inscripciones({
        accion: 'crear',
        session_token: sesion.token(),
        evento_id: evento.evento_id,
        nombre_acreditacion: datos.get('nombre_acreditacion'),
        observaciones: datos.get('observaciones'),
      });
      avisar(r.mensaje + ' Te enviamos la confirmación por correo y Telegram.');
      await vistaEvento(evento.evento_id);
    } catch (error) {
      if (manejarSesionVencida(error)) return;
      estado.textContent = error.message;
      estado.classList.add('form-estado-error');
      listo();
    }
  });
}

function bloqueInscripcion(evento, inscripcion, telegramVinculado) {
  if (inscripcion) {
    const texto = inscripcion.estado === 'CONFIRMADA'
      ? 'Tienes cupo confirmado en este evento.'
      : `Estás en la lista de espera, en la posición ${inscripcion.posicion_espera}. Si se libera un cupo te lo asignamos y te avisamos.`;
    return `<div class="nota nota-ok"><p><strong>${inscripcion.estado === 'CONFIRMADA' ? 'Inscripción confirmada' : 'En lista de espera'}.</strong> ${texto}</p>
      <p><a class="enlace" href="#/mis-inscripciones">Ver o editar mi inscripción</a></p></div>`;
  }
  if (!evento.acepta_inscripciones) {
    return `<p class="nota">Este evento no recibe inscripciones.</p>`;
  }
  if (!sesion.activa()) {
    sesion.destino = `#/evento/${evento.evento_id}`;
    return `<div class="nota"><p>Para inscribirte necesitas una cuenta y tener Telegram vinculado.</p>
      <p class="acciones"><a class="boton boton-senal" href="#/ingresar">Ingresar</a><a class="boton boton-borde" href="#/registro">Crear cuenta</a></p></div>`;
  }
  if (telegramVinculado === false) {
    return `<div class="nota"><p>Antes de inscribirte, vincula tu Telegram. Por ahí te avisamos de cupos, cambios y recordatorios.</p>
      <p><a class="boton boton-senal" href="#/perfil">Vincular Telegram</a></p></div>`;
  }
  const lleno = evento.disponibilidad === 'LLENO';
  return `
    <form class="form" id="form-inscripcion">
      <h2 class="subtitulo">${lleno ? 'Unirme a la lista de espera' : 'Inscribirme'}</h2>
      ${lleno ? '<p class="ayuda">El evento está lleno. Te inscribimos en lista de espera por orden de llegada.</p>' : ''}
      <label>Nombre para la acreditación
        <input name="nombre_acreditacion" maxlength="80" value="${esc(sesion.usuario().nombre)}" required />
        <span class="ayuda">Si inscribes a un niño o niña, escribe su nombre.</span>
      </label>
      <label>Observaciones <span class="opcional">(opcional)</span>
        <textarea name="observaciones" rows="2" maxlength="300" placeholder="Talla de camiseta, condición médica a tener en cuenta…"></textarea>
      </label>
      <button class="boton boton-senal" type="submit">${lleno ? 'Unirme a la lista de espera' : 'Confirmar inscripción'}</button>
      <p class="form-estado" role="alert"></p>
    </form>`;
}

// ---------------------------------------------------------------------------
// Registro e inicio de sesión
// ---------------------------------------------------------------------------
function vistaRegistro() {
  if (sesion.activa()) {
    location.hash = '#/perfil';
    return;
  }
  main.innerHTML = `
    <section class="pagina pagina-estrecha">
      <h1 class="titulo">Crear cuenta</h1>
      <p class="ayuda-larga">Con tu cuenta te inscribes a eventos y recibes avisos por correo y Telegram.</p>
      <form class="form" id="form-registro" novalidate>
        <label>Nombre completo<input name="nombre" autocomplete="name" minlength="3" required /></label>
        <label>Correo<input name="email" type="email" autocomplete="email" required /></label>
        <label>Contraseña<input name="password" type="password" autocomplete="new-password" minlength="8" required />
          <span class="ayuda">Mínimo 8 caracteres.</span></label>
        <button class="boton boton-senal" type="submit">Crear cuenta</button>
        <p class="form-estado" role="alert"></p>
      </form>
      <p>¿Ya tienes cuenta? <a class="enlace" href="#/ingresar">Ingresa</a></p>
    </section>`;
  const form = document.getElementById('form-registro');
  form.addEventListener('submit', (ev) => enviarFormulario(ev, form, 'Creando cuenta…', async (d) => {
    if (!form.checkValidity()) throw new ErrorApi('Revisa los campos: nombre, un correo válido y una contraseña de 8 caracteres o más.');
    await api.usuarios({ accion: 'crear', nombre: d.nombre, email: d.email, password: d.password });
    await iniciarSesion(d.email, d.password);
    avisar('Cuenta creada. Vincula tu Telegram para poder inscribirte.');
    location.hash = '#/perfil';
  }));
}

function vistaIngresar() {
  if (sesion.activa()) {
    location.hash = '#/';
    return;
  }
  main.innerHTML = `
    <section class="pagina pagina-estrecha">
      <h1 class="titulo">Ingresar</h1>
      <form class="form" id="form-ingreso">
        <label>Correo<input name="email" type="email" autocomplete="email" required /></label>
        <label>Contraseña<input name="password" type="password" autocomplete="current-password" required /></label>
        <button class="boton boton-senal" type="submit">Ingresar</button>
        <p class="form-estado" role="alert"></p>
      </form>
      <p>¿Primera vez? <a class="enlace" href="#/registro">Crea tu cuenta</a></p>
    </section>`;
  const form = document.getElementById('form-ingreso');
  form.addEventListener('submit', (ev) => enviarFormulario(ev, form, 'Ingresando…', async (d) => {
    await iniciarSesion(d.email, d.password);
    avisar(`Hola, ${sesion.usuario().nombre.split(' ')[0]}.`);
    const destino = sesion.destino && sesion.destino !== '#/ingresar' ? sesion.destino : '#/';
    sesion.destino = '';
    location.hash = destino;
  }));
}

async function iniciarSesion(email, password) {
  const r = await api.auth({ accion: 'login', email, password });
  sesion.guardar({ token: r.session_token, expira_en: r.expira_en, usuario: r.usuario });
}

// Envía un formulario mostrando estado de carga y el error en línea si falla.
async function enviarFormulario(ev, form, textoCarga, accion) {
  ev.preventDefault();
  const boton = form.querySelector('button[type=submit]');
  const estado = form.querySelector('.form-estado');
  estado.textContent = '';
  estado.className = 'form-estado';
  const listo = ocupado(boton, textoCarga);
  try {
    await accion(Object.fromEntries(new FormData(form)));
  } catch (error) {
    if (manejarSesionVencida(error)) return;
    estado.textContent = error.message;
    estado.classList.add('form-estado-error');
  } finally {
    listo();
  }
}

// ---------------------------------------------------------------------------
// Perfil: datos, Telegram y desactivación
// ---------------------------------------------------------------------------
async function vistaPerfil() {
  main.innerHTML = `<section class="pagina">${estadoCarga('Cargando tu perfil…')}</section>`;
  let usuario;
  try {
    ({ usuario } = await api.usuarios({ accion: 'perfil', session_token: sesion.token() }));
  } catch (error) {
    if (manejarSesionVencida(error)) return;
    main.innerHTML = `<section class="pagina">${estadoError(error.message)}</section>`;
    main.querySelector('[data-reintentar]').addEventListener('click', vistaPerfil);
    return;
  }
  const bot = telegramBot ? `<a class="enlace" href="https://t.me/${esc(telegramBot)}" target="_blank" rel="noopener">@${esc(telegramBot)}</a>` : 'el bot de EventPass';
  main.innerHTML = `
    <section class="pagina perfil">
      <h1 class="titulo">Tu perfil</h1>
      <div class="perfil-rejilla">
        <section class="tarjeta" aria-labelledby="t-telegram">
          <h2 class="subtitulo" id="t-telegram">Telegram</h2>
          ${usuario.telegram.vinculado
            ? `<p class="nota nota-ok">Vinculado como <strong>${esc(usuario.telegram.username)}</strong>. Aquí recibes confirmaciones, cambios de cupo y recordatorios.</p>
               <p class="ayuda">¿Cambiaste de cuenta? Genera un código nuevo y envíalo desde la otra cuenta.</p>`
            : `<p>Vincular Telegram es obligatorio para inscribirte. Así funciona:</p>`}
          <ol class="pasos">
            <li>Genera tu código. Vence en 10 minutos y sirve una sola vez.</li>
            <li>Abre ${bot} en Telegram.</li>
            <li>Envíale <code>/vincular TUCODIGO</code>.</li>
          </ol>
          <div id="zona-codigo"></div>
          <button class="boton ${usuario.telegram.vinculado ? 'boton-borde' : 'boton-senal'}" type="button" id="generar-codigo">Generar código de vinculación</button>
          <button class="boton boton-borde" type="button" id="revisar-vinculo" hidden>Ya lo envié, revisar</button>
        </section>

        <section class="tarjeta" aria-labelledby="t-datos">
          <h2 class="subtitulo" id="t-datos">Tus datos</h2>
          <form class="form" id="form-datos">
            <label>Nombre completo<input name="nombre" autocomplete="name" minlength="3" value="${esc(usuario.nombre)}" required /></label>
            <label>Correo<input value="${esc(usuario.email)}" disabled /><span class="ayuda">El correo no se puede cambiar.</span></label>
            <fieldset class="grupo-campos">
              <legend>Cambiar contraseña <span class="opcional">(opcional)</span></legend>
              <label>Contraseña actual<input name="password_actual" type="password" autocomplete="current-password" /></label>
              <label>Nueva contraseña<input name="password_nueva" type="password" autocomplete="new-password" minlength="8" /></label>
            </fieldset>
            <button class="boton boton-senal" type="submit">Guardar cambios</button>
            <p class="form-estado" role="alert"></p>
          </form>
        </section>

        <section class="tarjeta tarjeta-peligro" aria-labelledby="t-baja">
          <h2 class="subtitulo" id="t-baja">Desactivar cuenta</h2>
          <p>Tu cuenta queda inactiva y se cierran tus sesiones. Tus inscripciones quedan en el historial.</p>
          <form class="form" id="form-baja">
            <label>Confirma con tu contraseña<input name="password" type="password" autocomplete="current-password" required /></label>
            <button class="boton boton-peligro" type="submit">Desactivar mi cuenta</button>
            <p class="form-estado" role="alert"></p>
          </form>
        </section>
      </div>
    </section>`;

  const botonCodigo = document.getElementById('generar-codigo');
  botonCodigo.addEventListener('click', async () => {
    const zona = document.getElementById('zona-codigo');
    const listo = ocupado(botonCodigo, 'Generando…');
    try {
      const r = await api.codigoTelegram(sesion.token());
      const vence = new Date(r.expira_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      zona.innerHTML = `<div class="codigo" role="status">
          <p class="codigo-valor">${esc(r.codigo)}</p>
          <p>Envía <code>/vincular ${esc(r.codigo)}</code> al bot.</p>
          <p>Vence a las ${esc(vence)}</p>
        </div>`;
      botonCodigo.textContent = 'Generar otro código';
      document.getElementById('revisar-vinculo').hidden = false;
    } catch (error) {
      if (manejarSesionVencida(error)) return;
      zona.innerHTML = `<p class="form-estado form-estado-error">${esc(error.message)}</p>`;
    } finally {
      listo();
    }
  });
  document.getElementById('revisar-vinculo').addEventListener('click', vistaPerfil);

  const formDatos = document.getElementById('form-datos');
  formDatos.addEventListener('submit', (ev) => enviarFormulario(ev, formDatos, 'Guardando…', async (d) => {
    const cuerpo = { accion: 'actualizar', session_token: sesion.token(), nombre: d.nombre };
    if (d.password_nueva) Object.assign(cuerpo, { password_actual: d.password_actual, password_nueva: d.password_nueva });
    const r = await api.usuarios(cuerpo);
    sesion.guardar({ ...sesion.datos(), usuario: { ...sesion.usuario(), nombre: r.usuario.nombre } });
    pintarNav();
    formDatos.password_actual.value = formDatos.password_nueva.value = '';
    avisar(r.mensaje);
  }));

  const formBaja = document.getElementById('form-baja');
  formBaja.addEventListener('submit', (ev) => enviarFormulario(ev, formBaja, 'Desactivando…', async (d) => {
    const r = await api.usuarios({ accion: 'desactivar', session_token: sesion.token(), password: d.password });
    sesion.limpiar();
    avisar(r.mensaje);
    location.hash = '#/';
  }));
}

// ---------------------------------------------------------------------------
// Mis inscripciones: consultar, editar y cancelar
// ---------------------------------------------------------------------------
const ETIQUETA_ESTADO = { CONFIRMADA: 'Confirmada', LISTA_ESPERA: 'Lista de espera', CANCELADA: 'Cancelada' };

async function vistaInscripciones() {
  main.innerHTML = `<section class="pagina">${estadoCarga('Cargando tus inscripciones…')}</section>`;
  let datos;
  try {
    datos = await api.inscripciones({ accion: 'listar', session_token: sesion.token() });
  } catch (error) {
    if (manejarSesionVencida(error)) return;
    main.innerHTML = `<section class="pagina">${estadoError(error.message)}</section>`;
    main.querySelector('[data-reintentar]').addEventListener('click', vistaInscripciones);
    return;
  }
  const filas = datos.inscripciones.map((i) => {
    const e = i.evento || { nombre: i.evento_id, categoria: '' };
    const detalle = i.estado === 'LISTA_ESPERA' ? `Posición ${i.posicion_espera} en la lista` : (e.estado === 'CANCELADO' ? 'El evento fue cancelado' : '');
    return `
      <li class="inscripcion" data-disciplina="${claveDisciplina(e.categoria)}" data-estado="${i.estado}">
        <div class="inscripcion-evento">
          <p class="inscripcion-disciplina">${esc(e.categoria)}${e.grupo_edad ? ` · ${esc(e.grupo_edad)}` : ''}</p>
          <h2><a href="#/evento/${esc(i.evento_id)}">${esc(e.nombre)}</a></h2>
          <p>${e.inicio ? `${esc(fechaLarga(e.inicio))}, ${esc(horaDe(e.inicio))} · ${esc(e.lugar)}` : ''}</p>
          <p class="inscripcion-acreditacion">Acreditación: ${esc(i.nombre_acreditacion)}${i.observaciones ? ` · ${esc(i.observaciones)}` : ''}</p>
        </div>
        <div class="inscripcion-estado">
          <p class="estado estado-${i.estado.toLowerCase()}">${ETIQUETA_ESTADO[i.estado] || i.estado}</p>
          ${detalle ? `<p class="ayuda">${esc(detalle)}</p>` : ''}
          ${i.editable ? `<div class="acciones">
              <button class="boton boton-borde boton-chico" type="button" data-editar="${esc(i.inscripcion_id)}">Editar</button>
              <button class="boton boton-borde boton-chico" type="button" data-cancelar="${esc(i.inscripcion_id)}">Cancelar inscripción</button>
            </div>` : ''}
        </div>
        <div class="inscripcion-panel" id="panel-${esc(i.inscripcion_id)}"></div>
      </li>`;
  }).join('');

  main.innerHTML = `
    <section class="pagina">
      <h1 class="titulo">Mis inscripciones</h1>
      ${datos.telegram_vinculado ? '' : '<p class="nota">Aún no vinculas Telegram. <a class="enlace" href="#/perfil">Vincúlalo en tu perfil</a> para poder inscribirte.</p>'}
      ${datos.total
        ? `<ol class="inscripciones">${filas}</ol>`
        : `<div class="vacio"><p>Todavía no te has inscrito a ningún evento.</p><a class="boton boton-senal" href="#/">Ver la agenda</a></div>`}
    </section>`;

  main.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => {
    const ins = datos.inscripciones.find((i) => i.inscripcion_id === b.dataset.editar);
    const panel = document.getElementById(`panel-${ins.inscripcion_id}`);
    panel.innerHTML = `
      <form class="form form-en-linea">
        <label>Nombre para la acreditación<input name="nombre_acreditacion" maxlength="80" value="${esc(ins.nombre_acreditacion)}" required /></label>
        <label>Observaciones<textarea name="observaciones" rows="2" maxlength="300">${esc(ins.observaciones)}</textarea></label>
        <div class="acciones">
          <button class="boton boton-senal boton-chico" type="submit">Guardar</button>
          <button class="boton boton-borde boton-chico" type="button" data-cerrar>Descartar</button>
        </div>
        <p class="form-estado" role="alert"></p>
      </form>`;
    const form = panel.querySelector('form');
    form.querySelector('[data-cerrar]').addEventListener('click', () => { panel.innerHTML = ''; });
    form.addEventListener('submit', (ev) => enviarFormulario(ev, form, 'Guardando…', async (d) => {
      const r = await api.inscripciones({ accion: 'actualizar', session_token: sesion.token(), inscripcion_id: ins.inscripcion_id, ...d });
      avisar(r.mensaje);
      vistaInscripciones();
    }));
    form.querySelector('input').focus();
  }));

  main.querySelectorAll('[data-cancelar]').forEach((b) => b.addEventListener('click', () => {
    const ins = datos.inscripciones.find((i) => i.inscripcion_id === b.dataset.cancelar);
    const panel = document.getElementById(`panel-${ins.inscripcion_id}`);
    const liberaCupo = ins.estado === 'CONFIRMADA';
    panel.innerHTML = `
      <div class="confirmar" role="group" aria-label="Confirmar cancelación">
        <p>${liberaCupo ? 'Tu cupo pasará a la siguiente persona en lista de espera.' : 'Saldrás de la lista de espera.'} ¿Cancelar la inscripción a ${esc(ins.evento?.nombre || '')}?</p>
        <div class="acciones">
          <button class="boton boton-peligro boton-chico" type="button" data-si>Sí, cancelar inscripción</button>
          <button class="boton boton-borde boton-chico" type="button" data-no>Conservarla</button>
        </div>
        <p class="form-estado" role="alert"></p>
      </div>`;
    panel.querySelector('[data-no]').addEventListener('click', () => { panel.innerHTML = ''; });
    const si = panel.querySelector('[data-si]');
    si.focus();
    si.addEventListener('click', async () => {
      const listo = ocupado(si, 'Cancelando…');
      try {
        const r = await api.inscripciones({ accion: 'cancelar', session_token: sesion.token(), inscripcion_id: ins.inscripcion_id });
        avisar(r.mensaje);
        vistaInscripciones();
      } catch (error) {
        if (manejarSesionVencida(error)) return;
        const estado = panel.querySelector('.form-estado');
        estado.textContent = error.message;
        estado.classList.add('form-estado-error');
        listo();
      }
    });
  }));
}

// ---------------------------------------------------------------------------
// Arranque: valida la sesión guardada contra n8n (WF02) antes de pintar.
// ---------------------------------------------------------------------------
async function arrancar() {
  if (sesion.activa()) {
    try {
      const r = await api.auth({ accion: 'validar', session_token: sesion.token() });
      sesion.guardar({ ...sesion.datos(), usuario: r.usuario, expira_en: r.expira_en });
    } catch (error) {
      if (error instanceof ErrorApi && error.status >= 400 && error.status < 500) sesion.limpiar();
    }
  }
  window.addEventListener('hashchange', navegar);
  await navegar();
  iniciarChat();
}

arrancar();
