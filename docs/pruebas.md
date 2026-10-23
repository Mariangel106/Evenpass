# Casos de prueba

Lista para validar la solución completa una vez desplegada. Cada caso indica dónde verificar el resultado.

## Usuarios y sesiones (WF01, WF02)

| # | Acción | Resultado esperado | Verificar en |
|---|---|---|---|
| 1 | Registrarse con nombre, correo y contraseña de 8+ caracteres | Cuenta creada e inicio de sesión automático | EP01/Usuarios (hash y salt, estado `ACTIVO`), Auditoria_Usuarios `CREAR` |
| 2 | Registrarse otra vez con el mismo correo en MAYÚSCULAS | *Ya existe una cuenta con ese correo* (409) | Auditoria_Usuarios `RECHAZADO` |
| 3 | Ingresar con contraseña incorrecta | *Correo o contraseña incorrectos* | — |
| 4 | Ingresar bien | Sesión iniciada | EP02/Sesiones `ACTIVA`, `expira_en` = +8 h |
| 5 | Cambiar el nombre en el perfil | Se actualiza en la barra | EP01 `fecha_actualizacion` |
| 6 | Cambiar la contraseña con la actual incorrecta | Error en línea | — |
| 7 | Salir | Vuelve a la agenda | EP02 `CERRADA`, `cerrada_en` |
| 8 | Cambiar `expira_en` de una sesión a una fecha pasada y recargar la web | Se pide ingresar de nuevo | EP02 `EXPIRADA` |
| 9 | Desactivar la cuenta | Se cierra la sesión; ya no puede ingresar | EP01 `INACTIVO` |

## Telegram (WF03)

| # | Acción | Resultado esperado |
|---|---|---|
| 10 | Perfil → *Generar código de vinculación* | Código de 6 caracteres, vence en 10 min. EP03/Codigos `PENDIENTE` |
| 11 | Generar otro código | El anterior pasa a `CANCELADO` |
| 12 | Enviar `/vincular CODIGO` al bot | *Tu cuenta quedó vinculada*. Código `USADO`; Vinculaciones con `chat_id` y estado `ACTIVA` |
| 13 | Enviar el mismo código otra vez | *Ese código ya fue usado* |
| 14 | Enviar un código vencido | *Ese código venció*, estado `EXPIRADO` |
| 15 | Enviar `/start` | Instrucciones de vinculación |

## Catálogo (WF05)

| # | Acción | Resultado esperado |
|---|---|---|
| 16 | Abrir la agenda | 10 eventos; Natación Adultos con 0 cupos (lleno); Ciclismo Adultos con el sello **Cancelado** y su motivo |
| 17 | Filtrar por *Karate* y luego por *Niños* | 2 eventos, luego 1 |
| 18 | Abrir un evento | Detalle con confirmados, lista de espera y organizador |
| 19 | Revisar EP05/Consultas_Catalogo | Una fila por consulta, de tipo `LISTADO`, `FILTRO` o `DETALLE`, con `visitor_id` y `status_http` |

## Inscripciones (WF06) y notificaciones (WF09)

| # | Acción | Resultado esperado |
|---|---|---|
| 20 | Inscribirse sin Telegram vinculado | *Vincula tu cuenta de Telegram…* (409) |
| 21 | Inscribirse a un evento con cupo | `CONFIRMADA`; correo + Telegram; EP09 con `gmail_estado` y `telegram_estado` = `ENVIADO` |
| 22 | Intentar inscribirse otra vez al mismo evento | *Ya tienes una inscripción activa* (409); Auditoria_Inscripciones `DUPLICADO` |
| 23 | Inscribirse a *Copa Máster de Natación* (lleno) | `LISTA_ESPERA` en la posición 3, con aviso por ambos canales |
| 24 | Intentar inscribirse al evento cancelado | *Este evento fue cancelado* |
| 25 | Editar el nombre de acreditación | Se guarda; `fecha_actualizacion` cambia |
| 26 | Cancelar una inscripción | `CANCELADA` y aviso de cancelación |
| 27 | En WF09, desactivar temporalmente la credencial de Gmail e inscribirse | `gmail_estado = ERROR` con el detalle y `telegram_estado = ENVIADO` |

## Reasignación (WF07)

| # | Acción | Resultado esperado |
|---|---|---|
| 28 | Esperar 5 minutos tras crear las hojas (o ejecutar WF07 a mano) | En *Desafío CrossFit por Parejas* se promueve la inscripción de espera más antigua; la otra sigue en espera. Fila en EP07 con `orden_lista = 1` |
| 29 | Cancelar dos inscripciones confirmadas de la Copa Máster y ejecutar WF07 | Los dos primeros en espera (por `fecha_inscripcion`) pasan a `CONFIRMADA`; el tercero sigue esperando |
| 30 | Ejecutar WF07 de nuevo | No hay cambios (no hay cupos libres) |

## Recordatorios (WF08)

| # | Acción | Resultado esperado |
|---|---|---|
| 31 | Ejecutar WF08 con el evento *Mini Olimpiada* a menos de 24 h | Un `RECORDATORIO_24H` `ENVIADO` por cada confirmado; el usuario inactivo queda `OMITIDO` |
| 32 | Ejecutar WF08 otra vez | No se crean filas nuevas (idempotencia por `usuario_id|evento_id|tipo`) |
| 33 | Mover el evento a menos de 2 h y ejecutar | Nuevos `RECORDATORIO_2H` |

## Administración (WF04)

| # | Acción | Resultado esperado |
|---|---|---|
| 34 | Formulario *Crear evento* en estado `BORRADOR` | Página *Evento creado* con el ID; no aparece en la web |
| 35 | *Cambiar estado* → `PUBLICADO` | Aparece en la agenda |
| 36 | *Actualizar evento* cambiando la hora | Aviso a los inscritos por Gmail y Telegram |
| 37 | *Actualizar* con capacidad menor que los confirmados | *La capacidad no puede ser menor…* |
| 38 | *Cambiar estado* → `CANCELADO` con un motivo | Aviso a los inscritos; sello *Cancelado* y el motivo en la web |
| 39 | Intentar reabrir un evento cancelado | *No se puede pasar de CANCELADO a PUBLICADO* |
| 40 | Revisar Auditoria_Eventos | Filas `CREATE`, `UPDATE`, `STATUS`, `CANCEL` |

## Asistente (WF10)

| # | Acción | Resultado esperado |
|---|---|---|
| 41 | Preguntar *¿Qué eventos hay para niños?* | Lista de los eventos de niños con fecha y cupos |
| 42 | Preguntar *¿Por qué se canceló el Gran Fondo?* | Menciona el motivo (lluvias) |
| 43 | Pedir *Inscríbeme en la carrera 10K* | Dice que no puede hacerlo y explica cómo hacerlo en la web |
| 44 | Revisar EP10 | Una fila en Conversaciones; en Mensajes `SYSTEM`, `USER`, `ASSISTANT`… con el mismo `conversation_id` |

## Estados de la interfaz

| # | Acción | Resultado esperado |
|---|---|---|
| 45 | Abrir la web con la red lenta (DevTools → *Slow 3G*) | Texto *Cargando la agenda…* y dorsales de carga |
| 46 | Desactivar WF05 y recargar | Bloque de error con el mensaje y el botón *Intentar de nuevo* |
| 47 | Enviar formularios | El botón se deshabilita mientras espera, con texto de carga |
