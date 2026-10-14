// Servidor local para probar la aplicación sin Vercel.
//   npm run dev        → usa DEEPSEEK_API_KEY de .env.local
//   npm run dev:mock   → respuestas simuladas, sin gastar saldo
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErrorCliente, estaConfigurado, procesar } from './lib/chat.js';

const raiz = fileURLToPath(new URL('./public', import.meta.url));
const PUERTO = Number(process.env.PORT) || 3000;

const env = { ...process.env };
const envLocal = fileURLToPath(new URL('./.env.local', import.meta.url));
if (existsSync(envLocal)) {
  for (const linea of readFileSync(envLocal, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
}
if (process.argv.includes('--mock')) {
  env.MOCK = '1';
  delete env.DEEPSEEK_API_KEY;
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

function enviar(res, status, cuerpo, tipo = 'application/json') {
  res.writeHead(status, { 'Content-Type': tipo, 'Cache-Control': 'no-store' });
  res.end(typeof cuerpo === 'string' || Buffer.isBuffer(cuerpo) ? cuerpo : JSON.stringify(cuerpo));
}

async function leerCuerpo(req) {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  return Buffer.concat(trozos).toString('utf8');
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/api/health') {
      return enviar(res, 200, { ok: true, configurado: estaConfigurado(env) });
    }
    if (url.pathname === '/api/chat') {
      if (req.method !== 'POST') return enviar(res, 405, { error: 'Método no permitido.' });
      const body = JSON.parse(await leerCuerpo(req));
      return enviar(res, 200, await procesar(body, env));
    }
    let ruta = normalize(decodeURIComponent(url.pathname)).replace(/^([\\/])+/, '');
    if (ruta === '' || ruta.endsWith('\\') || ruta.endsWith('/')) ruta += 'index.html';
    if (!extname(ruta)) ruta += '.html'; // cleanUrls, como en Vercel
    const fichero = join(raiz, ruta);
    if (!fichero.startsWith(raiz)) return enviar(res, 403, 'Prohibido', 'text/plain');
    const contenido = await readFile(fichero);
    return enviar(res, 200, contenido, TIPOS[extname(fichero)] || 'application/octet-stream');
  } catch (err) {
    if (err instanceof ErrorCliente) return enviar(res, err.status, { error: err.message });
    if (err.code === 'ENOENT') return enviar(res, 404, 'No encontrado', 'text/plain');
    console.error(err);
    return enviar(res, 500, { error: 'Error inesperado.' });
  }
}).listen(PUERTO, () => {
  const modo = env.DEEPSEEK_API_KEY ? 'DeepSeek' : env.MOCK === '1' ? 'simulado' : 'SIN CLAVE';
  console.log(`Diálogo socrático en http://localhost:${PUERTO} (modo ${modo})`);
});
