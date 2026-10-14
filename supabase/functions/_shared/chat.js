// Lógica del diálogo, independiente de la plataforma: la usan la función de Supabase
// (supabase/functions/socrates) y dev-server.js (pruebas en local).
import { LOGROS, TEMAS, promptDialogo, promptPistas, reconduccion } from './prompts.js';
import { respuestaSimulada, pistasSimuladas } from './mock.js';

const MAX_MENSAJES = 90; // ~45 intervenciones del alumno
const MAX_CHARS_ALUMNO = 600;
const MAX_CHARS_SOCRATES = 1500;

// Autodelaciones y marcas que el personaje nunca debe decir. Son patrones de
// autoidentificación: en el tema de la IA, Sócrates sí puede hablar de máquinas.
const FUERA_DE_PAPEL = [
  /\b(deepseek|openai|chat\s?gpt|gpt-?\d|anthropic|claude|gemini)\b/i,
  /\bsoy\s+(un|una)\s+(ia|inteligencia artificial|modelo( de lenguaje)?|asistente( virtual)?|chatbot|bot|programa( informático)?)\b/i,
  /\bcomo\s+(un|una\s+)?(ia|inteligencia artificial|modelo de lenguaje|asistente)\s*,?\s*(no\s+)?(puedo|tengo|soy)\b/i,
];

export class ErrorCliente extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validar(body) {
  if (!body || typeof body !== 'object') throw new ErrorCliente(400, 'Petición vacía.');
  const { modo, tema, mensajes } = body;
  if (modo !== 'dialogo' && modo !== 'pista') throw new ErrorCliente(400, 'Modo no válido.');
  if (!Object.hasOwn(TEMAS, tema)) throw new ErrorCliente(400, 'Tema no válido.');
  if (!Array.isArray(mensajes) || mensajes.length === 0) throw new ErrorCliente(400, 'No hay mensajes.');
  if (mensajes.length > MAX_MENSAJES) {
    throw new ErrorCliente(413, 'El diálogo ya es muy largo. Guarda tu PDF y entrégalo.');
  }
  // Solo se aceptan turnos de alumno y de Sócrates: nunca instrucciones de sistema del cliente.
  const limpios = mensajes
    .filter((m) => m && (m.rol === 'alumno' || m.rol === 'socrates') && typeof m.texto === 'string')
    .map((m) => ({
      rol: m.rol,
      texto: m.texto.slice(0, m.rol === 'alumno' ? MAX_CHARS_ALUMNO : MAX_CHARS_SOCRATES).trim(),
    }))
    .filter((m) => m.texto.length > 0);
  if (limpios.length === 0) throw new ErrorCliente(400, 'No hay mensajes válidos.');
  if (modo === 'dialogo' && limpios.at(-1).rol !== 'alumno') {
    throw new ErrorCliente(400, 'El último mensaje debe ser del alumno.');
  }
  return { modo, tema, mensajes: limpios };
}

async function llamarDeepSeek(env, messages, maxTokens) {
  const base = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL || 'deepseek-flash',
      messages,
      thinking: { type: 'disabled' }, // sin modo razonamiento: respuestas rápidas
      response_format: { type: 'json_object' },
      temperature: 1.1,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    console.error('DeepSeek', res.status, detalle.slice(0, 500));
    if (res.status === 401) throw new ErrorCliente(503, 'La clave de DeepSeek no es válida.');
    if (res.status === 402) throw new ErrorCliente(503, 'La cuenta de DeepSeek no tiene saldo.');
    if (res.status === 429) throw new ErrorCliente(503, 'Sócrates está atendiendo a muchas personas. Reintenta en unos segundos.');
    throw new ErrorCliente(502, 'Sócrates no ha podido responder. Reintenta.');
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

function parsearJson(texto) {
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    const m = texto.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function limpiarRespuesta(texto) {
  return String(texto)
    .replace(/\*\*?|__|#+\s/g, '') // restos de markdown
    .replace(/<(?!\/?(may|iro)>)[^>]*>/g, '') // solo se permiten <may> e <iro>
    .trim();
}

const salirseDelPapel = (texto) => FUERA_DE_PAPEL.some((re) => re.test(texto));

// Historial en formato de la API. Los turnos de Sócrates se envían como el json que
// él mismo produce, para que el modelo mantenga el formato de salida.
function historial(mensajes) {
  // Une turnos consecutivos del mismo rol (p. ej., tras un envío fallido).
  const turnos = [];
  for (const m of mensajes) {
    const previo = turnos.at(-1);
    if (previo && previo.rol === m.rol) previo.texto += `\n${m.texto}`;
    else turnos.push({ ...m });
  }
  const api = turnos.map((m) =>
    m.rol === 'alumno'
      ? { role: 'user', content: m.texto }
      : { role: 'assistant', content: JSON.stringify({ respuesta: m.texto }) },
  );
  // El saludo inicial es de Sócrates; la API espera que el primer turno sea del usuario.
  if (api[0]?.role === 'assistant') api.unshift({ role: 'user', content: '(Se acerca a Sócrates.)' });
  return api;
}

async function turnoDialogo(env, tema, mensajes) {
  const system = { role: 'system', content: promptDialogo(tema) };
  let messages = [system, ...historial(mensajes)];

  for (let intento = 0; intento < 2; intento++) {
    const crudo = await llamarDeepSeek(env, messages, 700);
    const json = parsearJson(crudo);
    const respuesta = json && typeof json.respuesta === 'string' ? limpiarRespuesta(json.respuesta) : '';
    if (!respuesta) continue; // la API a veces devuelve contenido vacío: se reintenta
    if (salirseDelPapel(respuesta)) {
      messages = [
        ...messages,
        {
          role: 'system',
          content:
            'Tu última respuesta rompía el personaje. Responde de nuevo como Sócrates, sin mencionar tecnologías, modelos ni empresas, y vuelve a la pregunta del diálogo.',
        },
      ];
      continue;
    }
    const fase = Math.min(4, Math.max(1, Number.parseInt(json.fase, 10) || 1));
    const logros = Array.isArray(json.logros)
      ? [...new Set(json.logros.filter((l) => LOGROS.includes(l)))]
      : [];
    return { respuesta, fase, logros };
  }
  return { respuesta: reconduccion(tema), fase: null, logros: [] };
}

async function turnoPista(env, tema, mensajes) {
  const transcripcion = mensajes
    .slice(-12)
    .map((m) => `${m.rol === 'alumno' ? 'ESTUDIANTE' : 'SÓCRATES'}: ${m.texto.replace(/<\/?(may|iro)>/g, '')}`)
    .join('\n');
  const messages = [
    { role: 'system', content: promptPistas(tema) },
    { role: 'user', content: `Diálogo hasta ahora:\n${transcripcion}\n\nPropón las 3 pistas en json.` },
  ];
  const json = parsearJson(await llamarDeepSeek(env, messages, 400));
  const pistas = (Array.isArray(json?.pistas) ? json.pistas : [])
    .filter((p) => p && typeof p.texto === 'string' && p.texto.trim())
    .filter((p) => !salirseDelPapel(p.texto))
    .slice(0, 3)
    .map((p) => ({
      tipo: String(p.tipo || 'Pista').slice(0, 40),
      texto: limpiarRespuesta(p.texto).replace(/<\/?(may|iro)>/g, '').slice(0, 160),
    }));
  if (pistas.length === 0) throw new ErrorCliente(502, 'No se han podido generar pistas.');
  return { pistas };
}

export function estaConfigurado(env) {
  return Boolean(env.DEEPSEEK_API_KEY) || env.MOCK === '1';
}

export async function procesar(body, env) {
  const { modo, tema, mensajes } = validar(body);
  if (!env.DEEPSEEK_API_KEY) {
    if (env.MOCK === '1') {
      return modo === 'dialogo' ? respuestaSimulada(tema, mensajes) : pistasSimuladas();
    }
    throw new ErrorCliente(503, 'Falta configurar la clave de DeepSeek en el servidor.');
  }
  return modo === 'dialogo' ? turnoDialogo(env, tema, mensajes) : turnoPista(env, tema, mensajes);
}
