// GET /api/health: permite a la página del proyector comprobar que todo está listo.
import { estaConfigurado } from '../lib/chat.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, configurado: estaConfigurado(process.env) });
}
