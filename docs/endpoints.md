# Endpoints de EventPass

Base: `EP_N8N_BASE_URL` (por ejemplo `https://tu-instancia.app.n8n.cloud/webhook`).
Todas las respuestas son JSON. Un error siempre tiene la forma `{ "ok": false, "error": "mensaje para mostrar" }` y llega con su código HTTP.

## WF01 — `POST /ep/usuarios`

### Crear usuario
```json
{ "accion": "crear", "nombre": "Ana Prueba", "email": "ana@correo.com", "password": "secreta123" }
```
`201`
```json
{ "ok": true, "mensaje": "Cuenta creada. Ya puedes iniciar sesión.",
  "usuario": { "usuario_id": "USR-MVL0A1B2C3D4", "nombre": "Ana Prueba", "email": "ana@correo.com", "estado": "ACTIVO" } }
```
Errores: `400` (datos inválidos) y `409` (el correo ya existe).

### Consultar perfil
```json
{ "accion": "perfil", "session_token": "…" }
```
`200`
```json
{ "ok": true, "usuario": { "usuario_id": "USR-…", "nombre": "Ana Prueba", "email": "ana@correo.com", "estado": "ACTIVO",
  "fecha_registro": "2026-10-23T14:00:00.000Z",
  "telegram": { "vinculado": true, "username": "@ana", "fecha_vinculacion": "…" } } }
```

### Actualizar perfil
```json
{ "accion": "actualizar", "session_token": "…", "nombre": "Ana María Prueba",
  "password_actual": "secreta123", "password_nueva": "otraClave9" }
```
`password_actual` y `password_nueva` son opcionales; si se envía una, hay que enviar la otra. Responde `200`, o `400` si la contraseña actual es incorrecta o no hay cambios.

### Desactivar cuenta (borrado lógico)
```json
{ "accion": "desactivar", "session_token": "…", "password": "secreta123" }
```
`200`. La cuenta queda `INACTIVO` y ninguna de sus sesiones vuelve a ser válida.

## WF02 — `POST /ep/auth`

| accion | Cuerpo | Respuesta OK |
|---|---|---|
| `login` | `email`, `password` | `200 { ok, session_token, expira_en, usuario: { usuario_id, nombre, email } }` |
| `validar` | `session_token` | `200 { ok, valida: true, expira_en, usuario }` |
| `logout` | `session_token` | `200 { ok, mensaje: "Sesión cerrada." }` |

Errores: `401` (credenciales incorrectas, sesión inexistente, cerrada o expirada) y `403` (cuenta inactiva).

## WF03 — `POST /ep/telegram/codigo`
```json
{ "session_token": "…" }
```
`201`
```json
{ "ok": true, "codigo": "K7M2QX", "expira_en": "2026-10-23T14:10:00.000Z",
  "instruccion": "Envía /vincular K7M2QX al bot de EventPass en Telegram." }
```
Luego el usuario envía `/vincular K7M2QX` al bot. El **Telegram Trigger** valida el código y guarda el `chat_id`.

## WF05 — `GET /ep/catalogo`

| Parámetros | Uso |
|---|---|
| `tipo=LISTADO` | Todos los eventos publicables (no `BORRADOR`), ordenados por fecha |
| `tipo=DETALLE&evento_id=EVT-NAT-ADU` | Un evento (`404` si no existe o es borrador) |
| `tipo=FILTRO&categoria=Karate` y/o `grupo_edad=Niños` | Filtro por disciplina y/o grupo de edad |
| `visitor_id=VIS-…` | Opcional: identifica al visitante en el log |

Ejemplo de un evento en la respuesta:
```json
{ "evento_id": "EVT-NAT-ADU", "nombre": "Copa Máster de Natación 50 m", "categoria": "Natación", "grupo_edad": "Adultos",
  "fecha": "2026-11-04", "hora": "07:00", "inicio": "2026-11-04T12:00:00.000Z", "lugar": "Complejo Acuático Municipal, Bucaramanga",
  "estado": "PUBLICADO", "motivo_estado": "", "capacidad": 10, "inscritos_confirmados": 10, "lista_espera": 2,
  "cupos_disponibles": 0, "disponibilidad": "LLENO", "acepta_inscripciones": true }
```
`LISTADO` y `FILTRO` también devuelven `total` y `categorias`.

## WF06 — `POST /ep/inscripciones`

### Crear
```json
{ "accion": "crear", "session_token": "…", "evento_id": "EVT-NAT-NIN",
  "nombre_acreditacion": "Sofía Prueba", "observaciones": "Talla S" }
```
`201`
```json
{ "ok": true, "mensaje": "¡Listo! Tu cupo está confirmado.",
  "inscripcion": { "inscripcion_id": "INS-…", "evento_id": "EVT-NAT-NIN", "estado": "CONFIRMADA", "orden_espera": "", "nombre_acreditacion": "Sofía Prueba" } }
```
Si el evento está lleno, `estado` es `LISTA_ESPERA` y `orden_espera` indica la posición.

Errores `409`: falta vincular Telegram, el evento no está `PUBLICADO`, el evento ya empezó, o ya hay una inscripción activa (idempotencia). `404`: el evento no existe.

### Listar
```json
{ "accion": "listar", "session_token": "…" }
```
Devuelve `{ ok, telegram_vinculado, total, inscripciones: [ { inscripcion_id, estado, posicion_espera, editable, evento: {…} } ] }`.

### Actualizar (solo `nombre_acreditacion` y `observaciones`)
```json
{ "accion": "actualizar", "session_token": "…", "inscripcion_id": "INS-…", "nombre_acreditacion": "Sofía P.", "observaciones": "" }
```

### Cancelar
```json
{ "accion": "cancelar", "session_token": "…", "inscripcion_id": "INS-…" }
```
La inscripción pasa a `CANCELADA` y se notifica al usuario. Si era `CONFIRMADA`, WF07 asigna el cupo en su siguiente ejecución.

## WF10 — Chat Trigger

`POST <EP_CHAT_URL>`
```json
{ "action": "sendMessage", "sessionId": "CONV-… (o un valor temporal la primera vez)", "chatInput": "¿Qué eventos hay para niños?",
  "metadata": { "usuario_id": "USR-… o vacío", "visitor_id": "VIS-…" } }
```
Respuesta: `{ "output": "texto del asistente", "conversation_id": "CONV-…" }`.

## WF11 — Check-in digital

`POST /ep/checkin`
```json
{ "inscripcion_id": "INS-…", "evento_id": "EVT-…" }
```

**201 — EXITOSO**
```json
{ "ok": true, "resultado": "EXITOSO", "mensaje": "Check-in realizado correctamente.",
  "checkin": { "checkin_id": "CHK-…", "inscripcion_id": "INS-…", "evento_id": "EVT-…", "usuario_id": "USR-…", "fecha_checkin": "2026-10-29T12:16:56.412Z" },
  "inscripcion": { "inscripcion_id": "INS-…", "estado_anterior": "CONFIRMADA", "estado": "ASISTIO", "nombre_acreditacion": "…" },
  "evento": { "evento_id": "EVT-…", "nombre": "…", "fecha": "2026-11-01", "hora": "09:00", "lugar": "…" } }
```

**409 — DUPLICADO**
```json
{ "ok": false, "resultado": "DUPLICADO", "error": "El ingreso ya había sido registrado (jueves, 29 de octubre, 07:16 a. m.).",
  "checkin": { "checkin_id": "CHK-… (el original)", "fecha_checkin": "…" }, "inscripcion": { "inscripcion_id": "INS-…", "estado": "ASISTIO" } }
```

**400 / 404 / 409 — RECHAZADO**
```json
{ "ok": false, "resultado": "RECHAZADO", "motivo": "EVENTO_NO_CORRESPONDE",
  "error": "La inscripción INS-DEMO001 pertenece a otro evento (EVT-NAT-ADU), no a EVT-ATL-ADU.", "inscripcion_id": "INS-DEMO001", "evento_id": "EVT-ATL-ADU" }
```
`motivo`: `SOLICITUD_INCOMPLETA` (400) · `INSCRIPCION_INEXISTENTE` (404) · `EVENTO_INEXISTENTE` (404) · `EVENTO_NO_CORRESPONDE` (409) · `EVENTO_CANCELADO` (409) · `ESTADO_NO_PERMITIDO` (409).
