// Datos de la actividad que ve el alumnado. Sin dependencias del DOM: también
// los usa el generador de PDF.

export const LIMITE_TURNOS = 40;

export const TEMAS = [
  {
    id: 'belleza',
    pregunta: '¿Qué es la belleza?',
    sobre: 'o sobre la belleza',
    etiqueta: 'Clásico',
    escena: 'El ágora de Atenas',
    epoca: 'Siglo V a. C.',
    gancho: 'Hipias presume de saberlo todo… pero no sabe definir lo bello. ¿Y tú?',
    tema: 'agora',
    alias: 'Filósofo de Atenas',
    escribiendo: 'Sócrates se acaricia la barba…',
    pista: { boton: 'Lechuza', titulo: 'La lechuza de Atenea te susurra…' },
    placeholder: 'Responde a Sócrates…',
    escenaPdf: 'Sócrates conversa con {nombre} en el ágora de Atenas, una mañana de mercado.',
    saludo:
      '¡{nombre}! ¡Por Zeus, qué suerte encontrarte en el ágora! Vengo de discutir con Hipias, que presume de saberlo todo, y me ha dejado sin palabras: no supe explicarle qué es la belleza. <iro>Tú, que eres joven y seguro que sabes mucho más que este viejo, me sacarás del apuro.</iro> <may>Dime: ¿qué es la belleza?</may>',
  },
  {
    id: 'libertad',
    pregunta: '¿Ser libre es hacer lo que quiero?',
    sobre: 'o sobre la libertad',
    etiqueta: 'Clásico',
    escena: 'La palestra de Atenas',
    epoca: 'Como en el «Lisis»',
    gancho: 'Lisis creía que sí. Sus padres no le dejaban ni tocar el telar.',
    tema: 'palestra',
    alias: 'Filósofo de Atenas',
    escribiendo: 'Sócrates se sacude el polvo de la palestra…',
    pista: { boton: 'Lisis', titulo: 'Lisis te sopla una idea…' },
    placeholder: 'Responde a Sócrates…',
    escenaPdf: 'Sócrates conversa con {nombre} en una palestra de Atenas, después de hablar con el joven Lisis.',
    saludo:
      '¡Salud, {nombre}! Vengo de charlar aquí, en la palestra, con el joven Lisis. Sus padres lo quieren muchísimo y, sin embargo, <iro>¡no le dejan ni tocar el telar de su madre!</iro> Me he quedado pensando… Tú pareces una persona libre. <may>Dime: ¿qué es para ti ser libre? ¿Es poder hacer lo que uno quiere?</may>',
  },
  {
    id: 'giges',
    pregunta: '¿Harías lo correcto si nadie te viera?',
    sobre: 'o sobre la justicia',
    etiqueta: 'Clásico',
    escena: 'Noche de antorchas en el Pireo',
    epoca: 'El anillo de Giges',
    gancho: 'Un anillo de oro te vuelve invisible. Nadie sabrá nunca lo que haces.',
    tema: 'antorchas',
    alias: 'Filósofo de Atenas',
    escribiendo: 'Sócrates contempla las antorchas…',
    pista: { boton: 'Glaucón', titulo: 'Glaucón te susurra al oído…' },
    placeholder: 'Responde a Sócrates…',
    escenaPdf: 'Sócrates conversa con {nombre} en el Pireo, una noche de fiesta con carreras de antorchas.',
    saludo:
      'Acércate a la luz de las antorchas, {nombre}. Glaucón me acaba de contar una historia inquietante: un pastor llamado Giges encontró un anillo de oro que lo volvía invisible, y lo usó para hacer lo que le dio la gana sin que nadie lo descubriera. <iro>Seguro que tú, en su lugar, jamás habrías hecho nada parecido, ¿verdad?</iro> <may>Dime con sinceridad: si tuvieras ese anillo, ¿seguirías haciendo lo correcto? ¿Por qué?</may>',
  },
  {
    id: 'ia',
    pregunta: '¿Puede pensar una inteligencia artificial?',
    sobre: 'o sobre las máquinas que piensan',
    etiqueta: 'Actual',
    escena: 'Neo-Atenas, 2077',
    epoca: 'Ciberpunk',
    gancho: 'Las máquinas hablan, escriben y dibujan. Pero ¿piensan?',
    tema: 'cyber',
    alias: 'alias Tábano · Neo-Atenas',
    escribiendo: 'Descifrando respuesta…',
    pista: { boton: 'Oráculo', titulo: 'El Oráculo intercepta una señal…' },
    placeholder: '> escribe tu respuesta_',
    escenaPdf: 'Sócrates, alias Tábano, conversa con {nombre} en los bajos fondos de Neo-Atenas, en el año 2077.',
    saludo:
      'Conexión establecida. Hola, {nombre}. Aquí, en los bajos fondos de Neo-Atenas, todo el mundo dice que las máquinas ya piensan. <iro>Yo, que no sé nada de nada, estoy hecho un lío, así que qué suerte dar con alguien que seguro que lo tiene clarísimo.</iro> <may>Dime: cuando una máquina te contesta con una frase perfecta, ¿está pensando? ¿Qué es para ti «pensar»?</may>',
  },
  {
    id: 'redes',
    pregunta: '¿Somos lo que mostramos en redes?',
    sobre: 'o sobre la identidad',
    etiqueta: 'Actual',
    escena: 'La caverna digital',
    epoca: 'En directo',
    gancho: 'Filtros, historias y likes. ¿Quién eres cuando nadie te mira?',
    tema: 'neon',
    alias: '@socrates · 0 seguidores',
    escribiendo: 'Sócrates está escribiendo…',
    pista: { boton: 'Chat', titulo: 'El chat del directo comenta…' },
    placeholder: 'Escribe tu respuesta…',
    escenaPdf: 'Sócrates conversa con {nombre} en su directo desde «la caverna digital», que tiene cero seguidores.',
    saludo:
      '¡Hola, {nombre}! Te doy la bienvenida a mi directo, que ahora mismo tiene exactamente cero espectadores… bueno, uno: tú. <iro>Está claro que yo no sé nada de hacerme famoso; tú, en cambio, seguro que eres toda una celebridad en redes.</iro> Me ronda una duda: <may>la persona que aparece en tus fotos y vídeos, ¿eres tú de verdad? ¿Somos lo que mostramos en redes?</may>',
  },
];

export const temaPorId = (id) => TEMAS.find((t) => t.id === id);

// Las cuatro fases del élenchos, como en el «Lisis».
export const FASES = [
  { n: 1, nombre: 'Opinión', lema: 'Expón lo que piensas.' },
  { n: 2, nombre: 'Examen', lema: 'Sócrates pone a prueba tu idea.' },
  { n: 3, nombre: 'Aporía', lema: 'Has encontrado un problema en tu idea. ¡Bien! Así empieza la filosofía.' },
  { n: 4, nombre: 'Alumbramiento', lema: 'Has dado a luz una idea mejor. ¡Eso es la mayéutica!' },
];

// Movimientos socráticos que el juego reconoce (los detecta el servidor).
export const LOGROS = [
  { id: 'opinion', nombre: 'Doxa', desc: 'Expresaste tu opinión con claridad.', icono: 'i-opinion' },
  { id: 'definicion', nombre: 'Definición', desc: 'Intentaste decir qué es algo en general.', icono: 'i-definicion' },
  { id: 'ejemplo', nombre: 'Ejemplo', desc: 'Pusiste un ejemplo concreto.', icono: 'i-ejemplo' },
  { id: 'contraejemplo', nombre: 'Contraejemplo', desc: 'Encontraste un caso que no encaja.', icono: 'i-contraejemplo' },
  { id: 'pregunta', nombre: 'Tábano', desc: 'Le hiciste a Sócrates una pregunta que le hizo pensar.', icono: 'i-pregunta' },
  { id: 'ironia', nombre: 'Ojo de lechuza', desc: 'Te diste cuenta de la ironía de Sócrates.', icono: 'i-ironia' },
  { id: 'aporia', nombre: 'Sé que no sé', desc: 'Reconociste que tu idea tenía un problema.', icono: 'i-aporia' },
  { id: 'alumbramiento', nombre: 'Alumbramiento', desc: 'Reformulaste tu idea y la mejoraste.', icono: 'i-alumbramiento' },
];

export const PUNTOS = { logroNuevo: 10, logroRepetido: 3, fase: 15 };

// Pistas de reserva si el servidor no responde.
export const PISTAS_RESERVA = [
  { tipo: 'Pon un ejemplo', texto: 'Por ejemplo, una vez…' },
  { tipo: 'Busca un contraejemplo', texto: 'Pero no siempre es así, porque…' },
  { tipo: 'Pregunta a Sócrates', texto: 'Sócrates, ¿y tú qué entiendes por…' },
];
