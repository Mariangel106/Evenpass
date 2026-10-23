// Genera public/js/config.js a partir de variables de entorno.
// Vercel lo ejecuta como Build Command; en local: node scripts/generar-config.mjs (lee .env si existe).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

if (existsSync('.env')) {
  for (const linea of readFileSync('.env', 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const config = {
  N8N_BASE_URL: process.env.EP_N8N_BASE_URL || '',
  CHAT_URL: process.env.EP_CHAT_URL || '',
  TELEGRAM_BOT: process.env.EP_TELEGRAM_BOT || '',
};

for (const [clave, valor] of Object.entries(config)) {
  if (!valor) console.warn(`Aviso: la variable para ${clave} está vacía.`);
}

writeFileSync(
  'public/js/config.js',
  `// Archivo generado por scripts/generar-config.mjs. No editar a mano.\nwindow.EVENTPASS_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
);
console.log('public/js/config.js generado.');
