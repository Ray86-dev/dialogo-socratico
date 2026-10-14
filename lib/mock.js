// Modo de prueba (MOCK=1 sin clave): respuestas simuladas para probar la interfaz
// sin gastar saldo de la API.
import { TEMAS } from './prompts.js';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const PLANTILLAS = [
  '<iro>¡Por Zeus, {nombre}, qué respuesta tan sabia! Ya decía yo que sabías más que este viejo.</iro> Pero ayúdame, que soy algo torpe: <may>¿eso que dices vale para todos los casos o solo para algunos?</may>',
  'Has dicho algo muy interesante. <may>¿Me pones un ejemplo concreto de tu vida, del instituto o de tus amistades?</may>',
  '<iro>¿Cómo así? ¿Dices ahora lo contrario de lo que dijiste antes?</iro> <may>¿Pueden ser verdad las dos cosas a la vez, {nombre}?</may>',
  'Ah, parece que hemos llegado a un lugar sin salida, una aporía. <iro>¡Y yo que pensaba que esto era facilísimo!</iro> <may>¿Cómo podrías decir tu idea de una forma mejor, que resista mis objeciones?</may>',
  '<iro>¡Has dado a luz una idea preciosa, {nombre}! Tu madre partera estaría orgullosa… ah, no, esa era la mía.</iro> <may>¿Y qué consecuencias tendría tu nueva idea si todo el mundo la aceptara?</may>',
];

function logrosSimulados(texto) {
  const t = texto.toLowerCase();
  const logros = [];
  if (t.length > 25) logros.push('opinion');
  if (/\b(es|son|significa)\b/.test(t)) logros.push('definicion');
  if (/por ejemplo|como cuando|una vez/.test(t)) logros.push('ejemplo');
  if (/\bpero\b|no siempre|sin embargo/.test(t)) logros.push('contraejemplo');
  if (t.includes('?')) logros.push('pregunta');
  if (/ironí|irónic|me tomas el pelo|vacilando/.test(t)) logros.push('ironia');
  if (/no s[eé]|me equivoqu|tienes raz[oó]n|contradic/.test(t)) logros.push('aporia');
  if (/mejor dicho|ahora creo|en realidad/.test(t)) logros.push('alumbramiento');
  return logros;
}

export async function respuestaSimulada(tema, mensajes) {
  await espera(900);
  const turnosAlumno = mensajes.filter((m) => m.rol === 'alumno').length;
  const i = (turnosAlumno - 1) % PLANTILLAS.length;
  return {
    respuesta: PLANTILLAS[i] + (i === 0 ? ` <may>Recuerda nuestra pregunta: ${TEMAS[tema].pregunta}</may>` : ''),
    fase: Math.min(4, 1 + Math.floor(turnosAlumno / 2)),
    logros: logrosSimulados(mensajes.at(-1).texto),
  };
}

export async function pistasSimuladas() {
  await espera(700);
  return {
    pistas: [
      { tipo: 'Pon un ejemplo', texto: 'Por ejemplo, el otro día en el instituto…' },
      { tipo: 'Busca un contraejemplo', texto: 'Pero eso no pasa siempre, porque…' },
      { tipo: 'Pregunta a Sócrates', texto: 'Y tú, Sócrates, ¿qué entiendes por…' },
    ],
  };
}
