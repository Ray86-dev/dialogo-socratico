import { API, CABECERAS } from './config.js';
import { FASES, LIMITE_TURNOS, LOGROS, PISTAS_RESERVA, PUNTOS, TEMAS, temaPorId } from './topics.js';
import { segmentos } from './marks.js';
import { cargar, guardar } from './store.js';
import { iniciarFx } from './fx.js';

const $ = (s) => document.querySelector(s);
const estado = cargar();
const ROMANOS = ['', 'I', 'II', 'III', 'IV'];
const COLOR_BARRA = {
  portada: '#15120E', agora: '#F4EEE3', palestra: '#17100B', antorchas: '#0A1224', cyber: '#030806', neon: '#160A2E',
};

let tema = null; // tema abierto en el chat
let pararFx = null;
let ocupado = false;

const entrada = $('#i-mensaje');
const lista = $('#mensajes');
const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const conv = () => estado.conversaciones[tema.id];
const guardarEstado = () => guardar(estado);

// ---------- utilidades DOM ----------

function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    if (v == null || v === false) continue;
    if (k === 'class') nodo.className = v;
    else if (k === 'text') nodo.textContent = v;
    else if (k.startsWith('on')) nodo.addEventListener(k.slice(2), v);
    else nodo.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos) if (h != null && h !== false) nodo.append(h);
  return nodo;
}

function icono(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

function bajar(forzar = false) {
  const cerca = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 140;
  if (forzar || cerca) lista.scrollTop = lista.scrollHeight;
}

// En iOS el teclado no reduce la ventana: se ajusta la app al área visible.
if (window.visualViewport) {
  const ajustarAlto = () => {
    const vv = window.visualViewport;
    document.documentElement.style.setProperty('--alto', `${vv.height}px`);
    document.documentElement.style.setProperty('--arriba', `${vv.offsetTop}px`);
    bajar();
  };
  window.visualViewport.addEventListener('resize', ajustarAlto);
  window.visualViewport.addEventListener('scroll', ajustarAlto);
  ajustarAlto();
}

// ---------- ambientación y pantallas ----------

function ambientar(id) {
  document.documentElement.dataset.tema = id;
  $('meta[name="theme-color"]').content = COLOR_BARRA[id];
  pararFx?.();
  pararFx = iniciarFx($('#fx'), id);
}

function mostrar(id) {
  for (const p of document.querySelectorAll('.pantalla')) p.hidden = p.id !== id;
}

// ---------- 1. Nombre ----------

function capitalizar(nombre) {
  return nombre
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase('es'));
}

$('#f-nombre').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const nombre = capitalizar($('#i-nombre').value);
  const error = $('#error-nombre');
  if (!/^\p{L}[\p{L}' -]{0,29}$/u.test(nombre)) {
    error.textContent = 'Escribe solo tu nombre de pila, con letras.';
    error.hidden = false;
    $('#i-nombre').focus();
    return;
  }
  error.hidden = true;
  estado.nombre = nombre;
  guardarEstado();
  irATemas();
});

$('#b-cambiar-nombre').addEventListener('click', () => {
  $('#i-nombre').value = estado.nombre;
  mostrar('p-bienvenida');
  $('#i-nombre').focus();
});

// ---------- 2. Temas ----------

function irATemas() {
  tema = null;
  for (const n of document.querySelectorAll('[data-nombre]')) n.textContent = estado.nombre;
  pintarTemas();
  ambientar('portada');
  mostrar('p-temas');
}

function pintarTemas() {
  const items = TEMAS.map((t) => {
    const c = estado.conversaciones[t.id];
    const empezado = c?.mensajes.some((m) => m.rol === 'alumno');
    return el('li', {},
      el('button', { type: 'button', class: `tarjeta tarjeta--${t.tema}`, onclick: () => abrirChat(t.id) },
        el('span', { class: 'tarjeta__motivo', 'aria-hidden': 'true' }),
        el('span', { class: 'tarjeta__etiqueta', text: `${t.etiqueta} · ${t.epoca}` }),
        el('span', { class: 'tarjeta__pregunta', text: t.pregunta }),
        el('span', { class: 'tarjeta__escena', text: t.escena }),
        el('span', { class: 'tarjeta__gancho', text: t.gancho }),
        empezado && el('span', { class: 'tarjeta__progreso', text: `Continuar · Fase ${c.fase} de 4` }),
      ),
    );
  });
  $('#lista-temas').replaceChildren(...items);
}

// ---------- 3. Chat ----------

function nuevaConversacion(t) {
  return {
    mensajes: [{ rol: 'socrates', texto: t.saludo, fase: 1, t: Date.now() }],
    fase: 1, logros: {}, puntos: 0, pistas: 0, reflexion: '',
  };
}

function abrirChat(id) {
  tema = temaPorId(id);
  const nueva = !estado.conversaciones[id];
  if (nueva) {
    estado.conversaciones[id] = nuevaConversacion(tema);
    guardarEstado();
  }
  ambientar(tema.tema);
  $('#chat-escena').textContent = `${tema.escena} · ${tema.epoca}`;
  $('#t-chat').textContent = tema.pregunta;
  $('#pista-etiqueta').textContent = tema.pista.boton;
  $('#pistas-titulo').textContent = tema.pista.titulo;
  entrada.placeholder = tema.placeholder;
  entrada.value = ''; // el borrador de otro tema no se arrastra
  autoAltura();
  cerrarPistas();
  aplicarMarcas();
  pintarFases();
  pintarPuntos();
  mostrar('p-chat');
  pintarHistorial(nueva);
  actualizarComposer();
  history.pushState({ chat: id }, '');
}

function volver() {
  if (history.state?.chat) history.back();
  else irATemas();
}
$('#b-volver').addEventListener('click', volver);
window.addEventListener('popstate', () => {
  for (const d of document.querySelectorAll('dialog[open]')) d.close();
  if (tema) irATemas();
});

function nodoMensaje(m, { primero = false } = {}) {
  const esSocrates = m.rol === 'socrates';
  const quien = el('p', { class: 'msg__quien' }, esSocrates ? 'Sócrates' : estado.nombre);
  if (esSocrates && primero) quien.append(' ', el('span', { class: 'msg__alias', text: `· ${tema.alias}` }));
  const texto = el('p', { class: 'msg__texto' });
  if (esSocrates) {
    for (const s of segmentos(m.texto, estado.nombre)) {
      texto.append(s.marca ? el('span', { class: `mk-${s.marca}`, text: s.texto }) : document.createTextNode(s.texto));
    }
  } else {
    texto.textContent = m.texto;
  }
  return el('article', { class: `msg msg--${esSocrates ? 'socrates' : 'alumno'}` },
    quien, texto, !esSocrates && m.logros?.length ? chipsLogros(m.logros) : null);
}

function chipsLogros(ids) {
  return el('div', { class: 'msg__logros', 'aria-label': 'Movimientos socráticos reconocidos' },
    ...ids.map((id) => LOGROS.find((l) => l.id === id)).filter(Boolean)
      .map((l) => el('span', { class: 'chip-logro' }, icono(l.icono), l.nombre)));
}

function nodoHito(f, nuevo = false) {
  return el('div', { class: `hito${nuevo ? ' nuevo' : ''}`, role: 'note' },
    el('p', { class: 'hito__texto' }, `${ROMANOS[f]} · ${FASES[f - 1].nombre}`,
      el('span', { class: 'hito__lema', text: FASES[f - 1].lema })));
}

function pintarHistorial(animarSaludo) {
  const c = conv();
  lista.replaceChildren();
  let faseMax = 0;
  c.mensajes.forEach((m, i) => {
    if (m.rol === 'socrates' && (m.fase || 1) > faseMax) {
      for (let f = faseMax + 1; f <= (m.fase || 1); f++) lista.append(nodoHito(f));
      faseMax = m.fase || 1;
    }
    lista.append(nodoMensaje(m, { primero: i === 0 }));
  });
  if (turnosAlumno() >= LIMITE_TURNOS) mostrarFin();
  else if (c.mensajes.at(-1).rol === 'alumno') pintarError('Sócrates no llegó a responder.');
  bajar(true);
  if (animarSaludo) teclear(lista.querySelector('.msg--socrates .msg__texto'));
}

// Efecto máquina de escribir sobre un mensaje ya maquetado (respeta las marcas).
function teclear(p) {
  return new Promise((resolver) => {
    if (!p || reducirMovimiento()) return resolver();
    const nodos = [];
    const recorrido = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while (recorrido.nextNode()) nodos.push(recorrido.currentNode);
    const textos = nodos.map((n) => n.textContent);
    const total = textos.reduce((s, t) => s + t.length, 0);
    const porFotograma = Math.max(1, Math.ceil(total / 120)); // unos 2 segundos
    let i = 0;
    let j = 0;
    let raf = 0;
    nodos.forEach((n) => { n.textContent = ''; });
    p.classList.add('tecleando');
    lista.setAttribute('aria-busy', 'true');
    const acabar = () => {
      cancelAnimationFrame(raf);
      nodos.forEach((n, k) => { n.textContent = textos[k]; });
      p.classList.remove('tecleando');
      p.removeEventListener('click', acabar);
      lista.removeAttribute('aria-busy');
      bajar();
      resolver();
    };
    p.addEventListener('click', acabar); // tocar el mensaje lo muestra entero
    const paso = () => {
      let quedan = porFotograma;
      while (quedan > 0 && i < nodos.length) {
        const toma = Math.min(quedan, textos[i].length - j);
        j += toma;
        quedan -= toma;
        nodos[i].textContent = textos[i].slice(0, j);
        if (j >= textos[i].length) {
          i++;
          j = 0;
        }
      }
      bajar();
      if (i >= nodos.length) acabar();
      else raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
  });
}

const turnosAlumno = () => conv().mensajes.filter((m) => m.rol === 'alumno').length;

function actualizarComposer() {
  if (!tema) return;
  const fin = turnosAlumno() >= LIMITE_TURNOS;
  $('#b-enviar').disabled = ocupado || fin || !entrada.value.trim();
  $('#b-pista').disabled = ocupado || fin;
  entrada.disabled = fin;
}

function autoAltura() {
  entrada.style.height = 'auto';
  entrada.style.height = `${Math.min(entrada.scrollHeight, 152)}px`;
  actualizarComposer();
}
entrada.addEventListener('input', autoAltura);
entrada.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
    ev.preventDefault();
    $('#f-mensaje').requestSubmit();
  }
});
$('#f-mensaje').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const texto = entrada.value.trim();
  if (texto && !ocupado) enviar(texto);
});

async function pedir(temaId, modo, mensajes) {
  let res;
  try {
    res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...CABECERAS },
      body: JSON.stringify({ modo, tema: temaId, mensajes: mensajes.map(({ rol, texto, fase, logros }) => ({ rol, texto, fase, logros })) }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(60_000) : undefined,
    });
  } catch {
    throw new Error('No hay conexión. Comprueba el wifi o los datos y reintenta.');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || 'Sócrates no ha podido responder. Reintenta.');
  return datos;
}

async function enviar(texto) {
  const m = { rol: 'alumno', texto, t: Date.now() };
  conv().mensajes.push(m);
  guardarEstado();
  entrada.value = '';
  autoAltura();
  cerrarPistas();
  quitarErrores();
  lista.append(nodoMensaje(m));
  bajar(true);
  await responder();
}

function registrarLogros(c, ids, mensajeAlumno) {
  const nuevos = [];
  mensajeAlumno.logros = ids;
  for (const id of ids) {
    const antes = c.logros[id] || 0;
    c.logros[id] = antes + 1;
    c.puntos += antes ? PUNTOS.logroRepetido : PUNTOS.logroNuevo;
    if (!antes) nuevos.push(LOGROS.find((l) => l.id === id));
  }
  return nuevos;
}

async function responder() {
  const temaId = tema.id;
  const c = conv();
  ocupado = true;
  actualizarComposer();
  quitarErrores();
  const indicador = el('div', { class: 'escribiendo', role: 'status' },
    el('span', { class: 'escribiendo__puntos', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
    tema.escribiendo);
  lista.append(indicador);
  bajar(true);
  try {
    const r = await pedir(temaId, 'dialogo', c.mensajes);
    const ultimoAlumno = c.mensajes.findLast((m) => m.rol === 'alumno');
    const nuevos = registrarLogros(c, r.logros || [], ultimoAlumno);
    const faseAntes = c.fase;
    if (r.fase && r.fase > c.fase) {
      c.puntos += PUNTOS.fase * (r.fase - c.fase);
      c.fase = r.fase;
    }
    const m = { rol: 'socrates', texto: r.respuesta, fase: c.fase, t: Date.now() };
    c.mensajes.push(m);
    guardarEstado();
    if (tema?.id !== temaId) return; // el alumno salió del chat mientras esperaba

    indicador.remove();
    if (ultimoAlumno.logros.length) [...lista.querySelectorAll('.msg--alumno')].at(-1)?.append(chipsLogros(ultimoAlumno.logros));
    for (let f = faseAntes + 1; f <= c.fase; f++) lista.append(nodoHito(f, true));
    const nodo = nodoMensaje(m);
    lista.append(nodo);
    bajar(true);
    await teclear(nodo.querySelector('.msg__texto'));
    pintarFases();
    pintarPuntos(nuevos.length > 0 || c.fase > faseAntes);
    nuevos.forEach((l, i) => setTimeout(() => avisoLogro(l), i * 700));
    if (c.fase > faseAntes) setTimeout(() => avisoFase(c.fase), nuevos.length * 700);
    if (turnosAlumno() >= LIMITE_TURNOS) mostrarFin();
  } catch (err) {
    indicador.remove();
    if (tema?.id === temaId) pintarError(err.message);
  } finally {
    ocupado = false;
    actualizarComposer();
  }
}

function pintarError(mensaje) {
  quitarErrores();
  lista.append(el('div', { class: 'aviso-error', role: 'alert' },
    el('span', { text: mensaje }),
    el('button', { type: 'button', class: 'boton', onclick: () => responder() }, 'Reintentar')));
  bajar(true);
}
const quitarErrores = () => lista.querySelectorAll('.aviso-error').forEach((n) => n.remove());

function mostrarFin() {
  if (lista.querySelector('.fin-dialogo')) return;
  lista.append(el('p', { class: 'fin-dialogo', text: 'Has llegado al final del diálogo. ¡Enhorabuena! Guarda tu PDF y entrégalo en el aula virtual.' }));
}

// ---------- Fases, puntos y logros ----------

function pintarFases() {
  const c = conv();
  $('#fases').replaceChildren(...FASES.map((f) => el('li', {
    class: `${f.n <= c.fase ? 'hecha' : ''} ${f.n === c.fase ? 'actual' : ''}`.trim(),
    'aria-current': f.n === c.fase ? 'step' : null,
  }, f.nombre)));
}

function pintarPuntos(animar = false) {
  $('#puntos').textContent = conv().puntos;
  if (animar) {
    const b = $('#b-logros');
    b.classList.remove('salta');
    void b.offsetWidth;
    b.classList.add('salta');
  }
}

function aviso(...contenido) {
  const nodo = el('div', { class: 'aviso' }, ...contenido);
  $('#avisos').append(nodo);
  navigator.vibrate?.(25);
  setTimeout(() => nodo.remove(), 3400);
}
const avisoLogro = (l) => aviso(icono(l.icono),
  el('span', {}, el('span', { class: 'aviso__titulo', text: '¡Nuevo logro!' }), el('span', { class: 'aviso__nombre', text: l.nombre })),
  el('span', { class: 'aviso__puntos', text: `+${PUNTOS.logroNuevo}` }));
const avisoFase = (f) => aviso(icono('i-logros'),
  el('span', {}, el('span', { class: 'aviso__titulo', text: `Fase ${ROMANOS[f]}` }), el('span', { class: 'aviso__nombre', text: FASES[f - 1].nombre })),
  el('span', { class: 'aviso__puntos', text: `+${PUNTOS.fase}` }));

$('#b-logros').addEventListener('click', () => {
  const c = conv();
  $('#puntos-detalle').textContent = c.puntos;
  $('#lista-logros').replaceChildren(...LOGROS.map((l) => {
    const veces = c.logros[l.id] || 0;
    return el('li', { class: `logro${veces ? ' ganado' : ''}` },
      el('span', { class: 'logro__icono' }, icono(l.icono)),
      el('span', {}, el('span', { class: 'logro__nombre', text: l.nombre }), el('span', { class: 'logro__desc', text: l.desc })),
      el('span', { class: 'logro__veces', text: veces ? `×${veces}` : '' }));
  }));
  $('#d-logros').showModal();
});

$('#b-reiniciar').addEventListener('click', async () => {
  $('#d-logros').close();
  const ok = await confirmar('¿Empezar de nuevo?', 'Se borrará este diálogo y su progreso. Si quieres conservarlo, guarda antes el PDF.');
  if (!ok) return;
  delete estado.conversaciones[tema.id];
  guardarEstado();
  history.replaceState(null, '');
  abrirChat(tema.id);
});

function confirmar(titulo, texto) {
  return new Promise((resolver) => {
    const d = $('#d-confirmar');
    $('#t-confirmar').textContent = titulo;
    $('#confirmar-texto').textContent = texto;
    d.returnValue = '';
    d.addEventListener('close', () => resolver(d.returnValue === 'si'), { once: true });
    d.showModal();
  });
}

for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', (ev) => { if (ev.target === d) d.close(); }); // clic fuera
}
for (const b of document.querySelectorAll('[data-cerrar]')) b.addEventListener('click', () => b.closest('dialog').close());

// ---------- Marcas de lectura ----------

function aplicarMarcas() {
  $('#p-chat').classList.toggle('con-marcas', estado.marcas);
  $('#b-marcas').setAttribute('aria-pressed', String(estado.marcas));
  $('#leyenda').hidden = !estado.marcas;
}
$('#b-marcas').addEventListener('click', () => {
  estado.marcas = !estado.marcas;
  guardarEstado();
  aplicarMarcas();
});

// ---------- Pistas ----------

function cerrarPistas() {
  $('#pistas').hidden = true;
}
$('#b-cerrar-pistas').addEventListener('click', cerrarPistas);

$('#b-pista').addEventListener('click', async () => {
  if (ocupado) return;
  const temaId = tema.id;
  const c = conv();
  const caja = $('#pistas-lista');
  $('#pistas').hidden = false;
  caja.setAttribute('aria-busy', 'true');
  caja.replaceChildren(...[0, 1, 2].map(() => el('div', { class: 'pista pista--cargando', 'aria-hidden': 'true' })));
  bajar(true);
  ocupado = true;
  actualizarComposer();
  let pistas;
  try {
    pistas = (await pedir(temaId, 'pista', c.mensajes)).pistas;
  } catch {
    pistas = PISTAS_RESERVA;
  } finally {
    ocupado = false;
    actualizarComposer();
  }
  c.pistas += 1;
  guardarEstado();
  if (tema?.id !== temaId || $('#pistas').hidden) return;
  caja.removeAttribute('aria-busy');
  caja.replaceChildren(...pistas.map((p) => el('button', { type: 'button', class: 'pista', onclick: () => usarPista(p.texto) },
    el('span', { class: 'pista__tipo', text: p.tipo }),
    el('span', { class: 'pista__texto', text: p.texto }))));
});

function usarPista(texto) {
  const inicio = texto.replace(/(…|\.\.\.)\s*$/, '').trimEnd();
  const actual = entrada.value.trim();
  entrada.value = `${actual ? `${actual} ` : ''}${inicio} `;
  cerrarPistas();
  autoAltura();
  entrada.focus();
  entrada.setSelectionRange(entrada.value.length, entrada.value.length);
}

// ---------- Guardar PDF ----------

let jsPDFCargado = null;
function cargarJsPDF() {
  jsPDFCargado ??= new Promise((resolver, rechazar) => {
    if (window.jspdf) return resolver(window.jspdf.jsPDF);
    const s = el('script', { src: new URL('../vendor/jspdf.umd.min.js', import.meta.url).href });
    s.onload = () => resolver(window.jspdf.jsPDF);
    s.onerror = () => {
      jsPDFCargado = null;
      rechazar(new Error('No se pudo cargar el generador de PDF.'));
    };
    document.head.append(s);
  });
  return jsPDFCargado;
}

function puedeCompartir() {
  try {
    return Boolean(navigator.canShare?.({ files: [new File(['%PDF'], 'd.pdf', { type: 'application/pdf' })] }));
  } catch {
    return false;
  }
}

$('#b-guardar').addEventListener('click', () => {
  $('#i-reflexion').value = conv().reflexion || '';
  $('#estado-pdf').textContent = '';
  $('#b-compartir-pdf').hidden = !puedeCompartir();
  $('#d-guardar').showModal();
  cargarJsPDF().catch(() => {}); // precarga
});
$('#b-cancelar-pdf').addEventListener('click', () => $('#d-guardar').close());
$('#b-descargar-pdf').addEventListener('click', () => generarPdf('descargar'));
$('#b-compartir-pdf').addEventListener('click', () => generarPdf('compartir'));

async function generarPdf(modo) {
  const c = conv();
  const estadoPdf = $('#estado-pdf');
  const botones = [$('#b-descargar-pdf'), $('#b-compartir-pdf')];
  c.reflexion = $('#i-reflexion').value.trim();
  guardarEstado();
  botones.forEach((b) => { b.disabled = true; });
  estadoPdf.textContent = 'Preparando el PDF…';
  try {
    const [JsPDF, { crearPdf, nombreFichero }] = await Promise.all([cargarJsPDF(), import('./pdf.js')]);
    const datos = {
      nombre: estado.nombre, tema, mensajes: c.mensajes, fase: c.fase, logros: c.logros, puntos: c.puntos,
      pistas: c.pistas, reflexion: c.reflexion, marcas: $('#i-incluir-marcas').checked, fecha: new Date(),
    };
    const nombre = nombreFichero(datos);
    const blob = crearPdf(JsPDF, datos).output('blob');
    if (modo === 'compartir') {
      try {
        await navigator.share({ files: [new File([blob], nombre, { type: 'application/pdf' })], title: `${estado.nombre}, ${tema.sobre}` });
      } catch (err) {
        if (err.name === 'AbortError') {
          estadoPdf.textContent = '';
          return;
        }
        throw err;
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: nombre });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    estadoPdf.textContent = `Listo: ${nombre}. Ahora súbelo a la tarea del aula virtual.`;
  } catch (err) {
    console.error(err);
    estadoPdf.textContent = 'No se ha podido crear el PDF. Si lo has abierto desde otra app, abre esta página en Chrome o Safari y reintenta.';
  } finally {
    botones.forEach((b) => { b.disabled = false; });
  }
}

// ---------- Inicio ----------

if (estado.nombre) {
  irATemas();
} else {
  ambientar('portada');
  mostrar('p-bienvenida');
}
