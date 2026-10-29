# Guía de despliegue paso a paso

Tiempo estimado: 45–60 minutos. Necesitas una cuenta de Google, una de n8n (Cloud o autoalojada), una de Telegram, una de GitHub y una de Vercel.

## 1. Crear los 10 Google Sheets

1. Entra a <https://script.google.com> y crea un **Nuevo proyecto**.
2. Borra el contenido, pega todo [`setup/crear_hojas.gs`](setup/crear_hojas.gs) y guarda.
3. Arriba, elige la función `crearHojasEventPass` y pulsa **Ejecutar**. Acepta los permisos de Drive y Sheets.
4. Abre **Registro de ejecución**. Copia el JSON con los IDs.
5. En tu Drive aparece la carpeta **EventPass — Google Sheets** con `EP01_Usuarios` … `EP11_Checkin`.

> Las fechas de los eventos se calculan desde el día en que ejecutas el script. Si lo ejecutas varios días antes de la entrega, el evento "próximo" ya habrá pasado: vuelve a ejecutarlo, o cambia la fecha en `EP04_Eventos` o desde el formulario de WF04.

## 2. Crear el bot de Telegram

1. En Telegram, habla con **@BotFather** → `/newbot`.
2. Elige un nombre (por ejemplo, *EventPass Santander*) y un usuario terminado en `bot` (por ejemplo, `EventPassSantanderBot`).
3. Guarda el **token**. No lo subas al repositorio.

## 3. Credenciales en n8n

En n8n → **Credentials** → **Add credential**:

| Credencial | Se usa en | Notas |
|---|---|---|
| Google Sheets OAuth2 API | Todos los nodos de Google Sheets | Inicia sesión con la cuenta dueña de los Sheets |
| Gmail OAuth2 | WF09 → *Enviar Gmail* | Los correos salen desde esta cuenta |
| Telegram API | WF03 (trigger y respuestas) y WF09 → *Enviar Telegram* | Pega el token de BotFather |
| Google Gemini (PaLM) API | WF10 → *Modelo Gemini* | Clave gratuita en <https://aistudio.google.com/apikey> |
| Basic Auth | Los 4 formularios de WF04 | Usuario y contraseña del administrador |

> ¿Prefieres otro modelo? En WF10 reemplaza *Modelo Gemini* por otro nodo de chat (OpenAI, Anthropic Claude…) y conéctalo a la entrada **Chat Model** del agente. El resto del workflow no cambia.

## 4. Importar WF09 primero

Los workflows WF04, WF06, WF07 y WF08 llaman a WF09 por su ID, así que este va primero.

1. n8n → **Workflows** → **Import from File** → `n8n/WF09_notificaciones.json`.
2. Abre los nodos de Google Sheets, Gmail y Telegram y elige tus credenciales.
3. Guarda. El ID es la última parte de la URL: `…/workflow/`**`aBcD1234`**.

## 5. Escribir los IDs en los workflows

```bash
cp n8n/ids.example.json n8n/ids.json
# Pega los IDs de los Sheets (paso 1) y el de WF09 (paso 4)
python3 scripts/configurar_n8n.py
```

Esto genera `n8n/configurado/` con los 11 workflows apuntando a tus archivos. Esa carpeta y `ids.json` no se suben a git.

> Sin Python: en cada nodo de Google Sheets elige el documento de la lista **From list**, y en cada *Execute Sub-workflow* elige WF09.

## 6. Importar y activar el resto

1. Importa WF01–WF08, WF10 y WF11 desde `n8n/configurado/`. Si ya importaste WF09 desde la carpeta original, reimpórtalo desde aquí también: así queda con los IDs de tus Sheets.
2. En cada workflow asigna las credenciales en los nodos marcados con advertencia.
3. **Activa** los 11 workflows (interruptor *Active*). Los webhooks de producción solo responden con el workflow activo.
4. Anota:
   - La URL base de producción de los webhooks, por ejemplo `https://tu-instancia.app.n8n.cloud/webhook`.
   - En WF10 → *Chat Trigger*: la **Chat URL**.
   - En WF04: la URL de producción de cada formulario. Son las del administrador.

## 7. Publicar en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel → **Add New → Project** → importa el repositorio. Framework: **Other**. `vercel.json` ya define el build y la carpeta `public`.
3. En **Environment Variables** agrega `EP_N8N_BASE_URL`, `EP_CHAT_URL` y `EP_TELEGRAM_BOT` (ver `.env.example`).
4. **Deploy**. Abre la URL y revisa que cargue la agenda.
5. Opcional: en cada Webhook de n8n cambia *Allowed Origins* de `*` a tu dominio de Vercel.

## 8. Probar de punta a punta

Sigue la lista de [pruebas.md](pruebas.md). Lo mínimo:

1. Crea una cuenta **con tu correo real**.
2. En tu perfil genera el código y envía `/vincular CODIGO` al bot.
3. Inscríbete a un evento con cupo: debe llegarte un correo **y** un mensaje de Telegram.
4. Revisa las hojas: `EP06_Inscripciones` y `EP09_Notificaciones`.

## 9. Exportar los workflows para la entrega

En n8n, en cada workflow: menú **⋯ → Download**. Reemplaza los archivos de `n8n/` con estos nombres exactos:

```
WF01_usuarios_crud.json            WF06_inscripciones_crud.json
WF02_auth_sesiones.json            WF07_reasignacion_lista_espera.json
WF03_vinculacion_telegram.json     WF08_recordatorios.json
WF04_eventos_crud.json             WF09_notificaciones.json
WF05_catalogo_publico.json         WF10_eventpass_assistant.json
                                   WF11_checkin_digital.json
```

Antes de hacer commit, revisa que los JSON no contengan tokens. n8n no exporta los secretos de las credenciales, solo su nombre e ID.

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| La web dice *"El servicio no está disponible. ¿Está activo el workflow en n8n?"* | El workflow no está activo o la URL base está mal (falta `/webhook`) |
| Error de CORS en la consola | Falta *Allowed Origins* en el Webhook, o se está usando la URL `webhook-test` |
| El bot no responde a `/vincular` | WF03 no está activo, u otro workflow usa el mismo bot con un Telegram Trigger (solo puede haber uno por bot) |
| `Could not find sheet` | El nombre de la pestaña no coincide (respeta mayúsculas: `Codigos_Vinculacion`) |
| *Execute Sub-workflow* falla | El ID de WF09 no se reemplazó o WF09 no está guardado |
| Los formularios de WF04 se quedan cargando | Revisa que *Respond When* del Form Trigger sea *Workflow Finishes* y que el workflow termine en un nodo **Form → Completion** |
