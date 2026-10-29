# Estructura de Google Sheets

Cada workflow principal escribe en su propio archivo. Otros workflows pueden **leer** un archivo ajeno cuando lo necesitan, pero nunca escriben su información principal fuera de su archivo.

Todas las celdas están en formato de texto plano (`@`) y n8n escribe con `cellFormat: RAW`, así las fechas ISO y los IDs no se transforman.

Para crearlos automáticamente con los datos de prueba, usa [`setup/crear_hojas.gs`](setup/crear_hojas.gs).

## EP01_Usuarios
Escribe: **WF01** · Lo leen también: WF02, WF03, WF06, WF08, WF09

### Hoja `Usuarios`

| Columna | Nota |
|---|---|
| `usuario_id` |  |
| `nombre` |  |
| `email_normalizado` |  |
| `password_hash` |  |
| `password_salt` |  |
| `estado` |  |
| `fecha_registro` |  |
| `fecha_actualizacion` |  |

### Hoja `Auditoria_Usuarios`

| Columna | Nota |
|---|---|
| `auditoria_id` |  |
| `usuario_id` |  |
| `accion` |  |
| `fecha` |  |
| `resultado` |  |
| `detalle` |  |

## EP02_Sesiones
Escribe: **WF02** · Lo leen también: WF01, WF03, WF06

### Hoja `Sesiones`

| Columna | Nota |
|---|---|
| `session_id` |  |
| `usuario_id` |  |
| `session_token` |  |
| `creada_en` |  |
| `expira_en` |  |
| `estado` |  |
| `cerrada_en` |  |
| `ultima_validacion` |  |

## EP03_Telegram
Escribe: **WF03** · Lo leen también: WF01, WF06, WF09

### Hoja `Codigos_Vinculacion`

| Columna | Nota |
|---|---|
| `codigo_id` |  |
| `usuario_id` |  |
| `codigo` |  |
| `creado_en` |  |
| `expira_en` |  |
| `estado` |  |
| `usado_en` |  |

### Hoja `Vinculaciones`

| Columna | Nota |
|---|---|
| `vinculacion_id` |  |
| `usuario_id` |  |
| `chat_id` |  |
| `telegram_username` |  |
| `fecha_vinculacion` |  |
| `estado` |  |

## EP04_Eventos
Escribe: **WF04** · Lo leen también: WF05, WF06, WF07, WF08, WF10

### Hoja `Eventos`

| Columna | Nota |
|---|---|
| `evento_id` |  |
| `nombre` |  |
| `categoria` |  |
| `grupo_edad` | Campo adicional: Adultos / Niños. |
| `descripcion` |  |
| `fecha` |  |
| `hora` |  |
| `lugar` |  |
| `capacidad` |  |
| `imagen_url` |  |
| `organizador` |  |
| `estado` |  |
| `motivo_estado` | Campo adicional: motivo de cancelación o cierre, se muestra en la web. |
| `fecha_creacion` |  |
| `fecha_actualizacion` |  |

### Hoja `Auditoria_Eventos`

| Columna | Nota |
|---|---|
| `auditoria_id` |  |
| `evento_id` |  |
| `accion` |  |
| `fecha` |  |
| `resultado` |  |
| `detalle` |  |

## EP05_Catalogo_Log
Escribe: **WF05** · Lo leen también: —

### Hoja `Consultas_Catalogo`

| Columna | Nota |
|---|---|
| `consulta_id` |  |
| `fecha` |  |
| `tipo` |  |
| `evento_id` |  |
| `categoria` |  |
| `resultado_count` |  |
| `visitor_id` |  |
| `status_http` |  |

## EP06_Inscripciones
Escribe: **WF06** · Lo leen también: WF04, WF05, WF07, WF08, WF10

### Hoja `Inscripciones`

| Columna | Nota |
|---|---|
| `inscripcion_id` |  |
| `usuario_id` |  |
| `evento_id` |  |
| `estado` |  |
| `fecha_inscripcion` |  |
| `fecha_actualizacion` |  |
| `nombre_acreditacion` |  |
| `observaciones` |  |
| `origen` |  |
| `orden_espera` |  |

### Hoja `Auditoria_Inscripciones`

| Columna | Nota |
|---|---|
| `auditoria_id` |  |
| `inscripcion_id` |  |
| `usuario_id` |  |
| `evento_id` |  |
| `accion` |  |
| `estado_anterior` |  |
| `estado_nuevo` |  |
| `fecha` |  |
| `resultado` |  |
| `detalle` |  |

## EP07_Reasignaciones
Escribe: **WF07** · Lo leen también: —

### Hoja `Reasignaciones`

| Columna | Nota |
|---|---|
| `reasignacion_id` |  |
| `evento_id` |  |
| `inscripcion_id` |  |
| `usuario_id` |  |
| `fecha` |  |
| `orden_lista` |  |
| `estado_anterior` |  |
| `estado_nuevo` |  |
| `resultado_notificacion` |  |

## EP08_Recordatorios
Escribe: **WF08** · Lo leen también: —

### Hoja `Recordatorios`

| Columna | Nota |
|---|---|
| `recordatorio_id` |  |
| `usuario_id` |  |
| `evento_id` |  |
| `inscripcion_id` |  |
| `tipo_recordatorio` |  |
| `fecha_programada` |  |
| `fecha_envio` |  |
| `estado` |  |
| `clave_idempotencia` |  |

## EP09_Notificaciones
Escribe: **WF09** · Lo leen también: —

### Hoja `Notificaciones`

| Columna | Nota |
|---|---|
| `notificacion_id` |  |
| `usuario_id` |  |
| `tipo` |  |
| `titulo` |  |
| `mensaje` |  |
| `evento_id` |  |
| `inscripcion_id` |  |
| `fecha` |  |
| `gmail_estado` |  |
| `telegram_estado` |  |
| `gmail_error` |  |
| `telegram_error` |  |
| `clave_idempotencia` |  |

## EP10_Soporte
Escribe: **WF10** · Lo leen también: —

### Hoja `Conversaciones`

| Columna | Nota |
|---|---|
| `conversation_id` |  |
| `usuario_id` |  |
| `visitor_id` |  |
| `fecha_inicio` |  |
| `fecha_ultima_interaccion` |  |
| `estado` |  |

### Hoja `Mensajes`

| Columna | Nota |
|---|---|
| `message_id` |  |
| `conversation_id` |  |
| `usuario_id` |  |
| `visitor_id` |  |
| `rol` |  |
| `mensaje` |  |
| `timestamp` |  |

## EP11_Checkin
Escribe: **WF11** · Lo leen también: —

Archivo independiente del examen (check-in digital). Guarda **todos** los intentos; el estado `ASISTIO` se escribe en EP06.

### Hoja `Checkins`

| Columna | Nota |
|---|---|
| `checkin_id` | `CHK-…` |
| `inscripcion_id` |  |
| `evento_id` | El que envió la solicitud |
| `usuario_id` | Dueño de la inscripción (vacío si no existe) |
| `fecha_checkin` | ISO 8601 |
| `resultado` | `EXITOSO` · `RECHAZADO` · `DUPLICADO` |
| `detalle` | Motivo legible del resultado |
