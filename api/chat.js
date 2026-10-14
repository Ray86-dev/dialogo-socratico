// Función serverless de Vercel: POST /api/chat
// La clave de DeepSeek vive solo aquí (variable de entorno DEEPSEEK_API_KEY).
import { ErrorCliente, procesar } from '../lib/chat.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  // Solo se aceptan peticiones desde la propia aplicación.
  const origen = req.headers.origin;
  if (origen && new URL(origen).host !== req.headers.host) {
    return res.status(403).json({ error: 'Origen no permitido.' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    return res.status(200).json(await procesar(body, process.env));
  } catch (err) {
    if (err instanceof ErrorCliente) return res.status(err.status).json({ error: err.message });
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'JSON no válido.' });
    console.error(err);
    const tiempo = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return res
      .status(tiempo ? 504 : 500)
      .json({ error: tiempo ? 'Sócrates tarda demasiado en responder. Reintenta.' : 'Error inesperado. Reintenta.' });
  }
}
