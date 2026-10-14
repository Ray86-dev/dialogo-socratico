// Función de Supabase: el servidor de Sócrates.
//   GET  → { ok, configurado } (lo usa la página del proyector)
//   POST → { modo: 'dialogo' | 'pista', tema, mensajes } → respuesta de Sócrates o pistas
// La clave de DeepSeek vive solo aquí, como secreto DEEPSEEK_API_KEY del proyecto.
import { ErrorCliente, estaConfigurado, procesar } from '../_shared/chat.js';

// Solo la web publicada y el servidor de pruebas local pueden usar la función.
const ORIGENES = [/^https:\/\/ray86-dev\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const permitido = (origen: string | null) => !origen || ORIGENES.some((re) => re.test(origen));

const entorno = () => ({
  DEEPSEEK_API_KEY: Deno.env.get('DEEPSEEK_API_KEY'),
  DEEPSEEK_MODEL: Deno.env.get('DEEPSEEK_MODEL'),
  DEEPSEEK_BASE_URL: Deno.env.get('DEEPSEEK_BASE_URL'),
  MOCK: Deno.env.get('MOCK'),
});

Deno.serve(async (req: Request) => {
  const origen = req.headers.get('origin');
  const cabeceras = {
    'Access-Control-Allow-Origin': origen && permitido(origen) ? origen : 'https://ray86-dev.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  const responder = (status: number, cuerpo: unknown) =>
    new Response(JSON.stringify(cuerpo), { status, headers: cabeceras });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabeceras });
  if (!permitido(origen)) return responder(403, { error: 'Origen no permitido.' });
  if (req.method === 'GET') return responder(200, { ok: true, configurado: estaConfigurado(entorno()) });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  try {
    const body = await req.json();
    return responder(200, await procesar(body, entorno()));
  } catch (err) {
    const e = err as { status?: number; message?: string; name?: string };
    if (err instanceof ErrorCliente) return responder(e.status ?? 400, { error: e.message });
    if (err instanceof SyntaxError) return responder(400, { error: 'JSON no válido.' });
    console.error(err);
    const tiempo = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return responder(tiempo ? 504 : 500, {
      error: tiempo ? 'Sócrates tarda demasiado en responder. Reintenta.' : 'Error inesperado. Reintenta.',
    });
  }
});
