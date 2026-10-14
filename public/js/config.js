// Dónde vive Sócrates: una función de Supabase que guarda la clave de DeepSeek.
// La clave «anon» es pública por diseño (solo permite invocar la función); la de
// DeepSeek nunca llega al navegador.
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API = LOCAL
  ? '/api/socrates' // servidor de pruebas (npm run dev)
  : 'https://klxpfmkpwoszzrnhyfsn.supabase.co/functions/v1/socrates';

const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtseHBmbWtwd29zenpybmh5ZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDA5MDksImV4cCI6MjEwNzU3NjkwOX0.C5oJzFJQg7b3gDSyxu7ddG7R6X7oIh0nb9xuuf-dkRs';

export const CABECERAS = LOCAL ? {} : { Authorization: `Bearer ${ANON}`, apikey: ANON };
