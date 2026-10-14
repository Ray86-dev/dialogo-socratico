// Genera el PDF del diálogo con jsPDF, maquetado como un diálogo platónico
// («Lucía, o sobre la belleza») y tematizado según la pregunta elegida.
// Funciona en el navegador y en Node (para las pruebas): recibe el constructor jsPDF.
import { FASES, LOGROS } from './topics.js';
import { conNombre, segmentos } from './marks.js';

const PAG = { w: 210, h: 297 };
const M = { izq: 26, der: 20, sup: 26, inf: 24 };
const ANCHO = PAG.w - M.izq - M.der;
const PT = 0.3528; // milímetros por punto tipográfico
const ROMANOS = ['', 'I', 'II', 'III', 'IV'];

const ESTILOS = {
  agora: {
    fuente: 'times', tam: 11.5, centrado: true,
    fondo: '#FBF7EE', tinta: '#2B2219', suave: '#75644F', acento: '#946A22', acento2: '#5E6B3A',
    regla: '#D9C7A2', may: '#CFE2F8', iro: '#FAD2A8', iroLinea: '#C8571E',
  },
  palestra: {
    fuente: 'times', tam: 11.5, centrado: true,
    fondo: '#FAF2E8', tinta: '#24170F', suave: '#7A5A42', acento: '#B5531F', acento2: '#3A2418',
    regla: '#E5C29F', may: '#CFE2F8', iro: '#FAD2A8', iroLinea: '#C8571E',
    banda: '#17100B', claro: '#F3E3CC', terracota: '#D9773A',
  },
  antorchas: {
    fuente: 'times', tam: 11.5, centrado: true,
    fondo: '#FBF8F1', tinta: '#1D2333', suave: '#5D6680', acento: '#9A6B12', acento2: '#26406E',
    regla: '#D8CBA8', may: '#CFE2F8', iro: '#FAD2A8', iroLinea: '#C8571E',
    banda: '#0B1426', claro: '#EDE6D6', oro: '#E3B341', fuego: '#FF8A3D', llama: '#FFD36B',
  },
  cyber: {
    fuente: 'courier', tam: 10, centrado: false,
    fondo: '#060B08', tinta: '#C9F7DD', suave: '#62A685', acento: '#39FF8F', acento2: '#FF5FA8',
    regla: '#1D4A33', may: '#103848', iro: '#47290F', iroLinea: '#FF9A3D', cian: '#2DE2E6',
  },
  neon: {
    fuente: 'helvetica', tam: 10.5, centrado: false,
    fondo: '#FFF8FC', tinta: '#24103F', suave: '#7B5C99', acento: '#C81E93', acento2: '#0A7F92',
    regla: '#F0C6E6', may: '#D3E6FB', iro: '#FFD9B5', iroLinea: '#E0562B',
    noche: '#1B0B3A', rosa: '#FF4FD8', cian: '#3EF2FF',
  },
};

// ---------- utilidades de color, texto y dibujo ----------

const rgb = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const mezcla = (a, b, t) => {
  const [x, y] = [rgb(a), rgb(b)];
  return x.map((v, i) => Math.round(v + (y[i] - v) * t));
};
const relleno = (doc, c) => doc.setFillColor(...(Array.isArray(c) ? c : rgb(c)));
const trazo = (doc, c) => doc.setDrawColor(...(Array.isArray(c) ? c : rgb(c)));
const color = (doc, c) => doc.setTextColor(...(Array.isArray(c) ? c : rgb(c)));
const opacidad = (doc, a) => doc.setGState(new doc.GState({ opacity: a, 'stroke-opacity': a }));

// Las fuentes estándar de PDF solo cubren el juego WinAnsi: se quitan emojis y
// caracteres que no se podrían imprimir.
function seguro(s) {
  return String(s)
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\n\x20-\x7E -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/gu, (c) => {
      const base = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return /^[\x20-\x7E]$/.test(base) ? base : '';
    });
}

function semilla(texto) {
  let a = [...texto].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function texto(doc, s, x, y, { fuente, estilo = 'normal', tam, col, align = 'left', espaciado = 0 }) {
  doc.setFont(fuente, estilo);
  doc.setFontSize(tam);
  color(doc, col);
  const limpio = seguro(s);
  if (espaciado && align === 'center') {
    // jsPDF no descuenta el espaciado al centrar: se calcula a mano.
    const ancho = doc.getTextWidth(limpio) + espaciado * (limpio.length - 1);
    doc.text(limpio, x - ancho / 2, y, { charSpace: espaciado });
  } else {
    doc.text(limpio, x, y, { align, charSpace: espaciado });
  }
}

// Reduce el cuerpo de letra hasta que el texto quepa en el ancho dado.
function tamQueCabe(doc, s, fuente, estilo, tamMax, anchoMax) {
  doc.setFont(fuente, estilo);
  let tam = tamMax;
  while (tam > 14) {
    doc.setFontSize(tam);
    if (doc.getTextWidth(seguro(s)) <= anchoMax) break;
    tam -= 1;
  }
  return tam;
}

function poligono(doc, puntos, estilo) {
  const [x0, y0] = puntos[0];
  const tramos = puntos.slice(1).map(([x, y], i) => [x - puntos[i][0], y - puntos[i][1]]);
  doc.lines(tramos, x0, y0, [1, 1], estilo, true);
}

// Curva cerrada de dos béziers cúbicas: base → punta → base.
function gota(doc, base, c1, c2, punta, c3, c4, estilo = 'F') {
  const r = (p, o) => [p[0] - o[0], p[1] - o[1]];
  doc.lines(
    [
      [...r(c1, base), ...r(c2, base), ...r(punta, base)],
      [...r(c3, punta), ...r(c4, punta), ...r(base, punta)],
    ],
    base[0], base[1], [1, 1], estilo, true,
  );
}

// ---------- ornamentos ----------

// Meandro griego continuo. alto = altura de la greca.
function meandro(doc, x0, y0, ancho, alto, col, grosor = 0.4) {
  const u = alto / 10;
  const periodo = 10 * u;
  const n = Math.floor(ancho / periodo);
  const xi = x0 + (ancho - n * periodo) / 2;
  const P = [[0, 10], [0, 0], [8, 0], [8, 6], [4, 6], [4, 4], [6, 4], [6, 2], [2, 2], [2, 8], [10, 8], [10, 10]];
  trazo(doc, col);
  doc.setLineWidth(grosor);
  for (let k = 0; k < n; k++) {
    const ox = xi + k * periodo;
    const tramos = P.slice(1).map(([x, y], i) => [(x - P[i][0]) * u, (y - P[i][1]) * u]);
    doc.lines(tramos, ox + P[0][0] * u, y0 + P[0][1] * u, [1, 1], 'S', false);
  }
  doc.line(xi, y0 - 1.6 * u, xi + n * periodo, y0 - 1.6 * u);
  doc.line(xi, y0 + 11.6 * u, xi + n * periodo, y0 + 11.6 * u);
}

function hoja(doc, x, y, ang, largo, anchoHoja) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const P = (a, b) => [x + a * c - b * s, y + a * s + b * c];
  gota(doc, [x, y], P(0.25 * largo, anchoHoja), P(0.75 * largo, anchoHoja * 0.8), P(largo, 0),
    P(0.75 * largo, -anchoHoja * 0.8), P(0.25 * largo, -anchoHoja));
}

// Rama de laurel sobre un arco de elipse, de a0 a a1 (radianes, eje y hacia abajo).
function laurel(doc, cx, cy, rx, ry, a0, a1, col, hojas = 9) {
  const punto = (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  trazo(doc, col);
  relleno(doc, col);
  doc.setLineWidth(0.45);
  const tallo = Array.from({ length: 25 }, (_, i) => punto(a0 + ((a1 - a0) * i) / 24));
  doc.lines(tallo.slice(1).map(([x, y], i) => [x - tallo[i][0], y - tallo[i][1]]), ...tallo[0], [1, 1], 'S', false);
  const sentido = Math.sign(a1 - a0);
  for (let i = 1; i <= hojas; i++) {
    const a = a0 + ((a1 - a0) * i) / (hojas + 0.6);
    const [x, y] = punto(a);
    const tangente = Math.atan2(ry * Math.cos(a) * sentido, -rx * Math.sin(a) * sentido);
    const largo = 6.2 - (i / hojas) * 1.8;
    hoja(doc, x, y, tangente - 0.55, largo, largo * 0.32);
    hoja(doc, x, y, tangente + 0.55, largo, largo * 0.32);
  }
  hoja(doc, ...punto(a1), Math.atan2(ry * Math.cos(a1) * sentido, -rx * Math.sin(a1) * sentido), 4.6, 1.5);
}

function columna(doc, x, yArriba, alto, ancho, col) {
  trazo(doc, col);
  doc.setLineWidth(0.4);
  const yAbajo = yArriba + alto;
  doc.rect(x - ancho * 0.78, yArriba, ancho * 1.56, ancho * 0.22); // ábaco
  poligono(doc, [
    [x - ancho * 0.72, yArriba + ancho * 0.22],
    [x + ancho * 0.72, yArriba + ancho * 0.22],
    [x + ancho * 0.48, yArriba + ancho * 0.5],
    [x - ancho * 0.48, yArriba + ancho * 0.5],
  ], 'S'); // equino
  const ySup = yArriba + ancho * 0.5;
  const yInf = yAbajo - ancho * 0.3;
  poligono(doc, [
    [x - ancho * 0.44, ySup], [x + ancho * 0.44, ySup],
    [x + ancho * 0.5, yInf], [x - ancho * 0.5, yInf],
  ], 'S'); // fuste
  doc.setLineWidth(0.18);
  for (let i = 1; i < 5; i++) {
    const t = -1 + (2 * i) / 5;
    doc.line(x + t * ancho * 0.44, ySup + 0.8, x + t * ancho * 0.5, yInf - 0.8); // estrías
  }
  doc.setLineWidth(0.4);
  doc.rect(x - ancho * 0.7, yInf, ancho * 1.4, ancho * 0.15);
  doc.rect(x - ancho * 0.8, yInf + ancho * 0.15, ancho * 1.6, ancho * 0.15);
}

function antorcha(doc, x, y, e) {
  relleno(doc, '#6B4A2B');
  poligono(doc, [[x - 1.3, y], [x + 1.3, y], [x + 0.6, y + 30], [x - 0.6, y + 30]], 'F');
  relleno(doc, e.oro);
  doc.rect(x - 2.2, y - 1.2, 4.4, 2.6, 'F');
  relleno(doc, e.fuego);
  gota(doc, [x, y - 1], [x - 6.5, y - 4], [x - 2.5, y - 11], [x + 0.6, y - 17], [x + 3.5, y - 10], [x + 5.8, y - 4]);
  relleno(doc, e.llama);
  gota(doc, [x, y - 1.2], [x - 3.2, y - 3.5], [x - 1.2, y - 8], [x + 0.3, y - 11], [x + 1.8, y - 7], [x + 3, y - 3.5]);
}

function estrellas(doc, rnd, x0, y0, ancho, alto, n, col) {
  relleno(doc, col);
  for (let i = 0; i < n; i++) {
    opacidad(doc, 0.25 + rnd() * 0.7);
    doc.circle(x0 + rnd() * ancho, y0 + rnd() * alto, 0.15 + rnd() * 0.45, 'F');
  }
  opacidad(doc, 1);
}

function degradado(doc, x, y, ancho, alto, paradas) {
  const paso = 0.5;
  for (let yy = 0; yy < alto; yy += paso) {
    const t = yy / alto;
    let i = 0;
    while (i < paradas.length - 2 && t > paradas[i + 1][0]) i++;
    const [t0, c0] = paradas[i];
    const [t1, c1] = paradas[i + 1];
    relleno(doc, mezcla(c0, c1, Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))));
    doc.rect(x, y + yy, ancho, paso + 0.05, 'F');
  }
}

// ---------- portadas (cabecera de la primera página) ----------

function tituloCentrado(ctx, y, { colNombre, colSobre, colKicker }) {
  const { doc, e, d } = ctx;
  texto(doc, 'DIÁLOGO SOCRÁTICO', PAG.w / 2, y, { fuente: e.fuente, estilo: 'bold', tam: 9, col: colKicker, align: 'center', espaciado: 1.4 });
  const tam = tamQueCabe(doc, d.nombre, e.fuente, 'bold', 32, 120);
  texto(doc, d.nombre, PAG.w / 2, y + 16, { fuente: e.fuente, estilo: 'bold', tam, col: colNombre, align: 'center' });
  texto(doc, d.tema.sobre, PAG.w / 2, y + 26, { fuente: e.fuente, estilo: 'italic', tam: 16, col: colSobre, align: 'center' });
}

const PORTADAS = {
  agora(ctx) {
    const { doc, e } = ctx;
    meandro(doc, 14, 10, 182, 6, e.acento, 0.45);
    columna(doc, 24, 26, 52, 9, e.acento);
    columna(doc, PAG.w - 24, 26, 52, 9, e.acento);
    tituloCentrado(ctx, 34, { colNombre: e.tinta, colSobre: e.suave, colKicker: e.acento });
    trazo(doc, e.acento);
    doc.setLineWidth(0.3);
    doc.line(78, 70, 100, 70);
    doc.line(110, 70, 132, 70);
    relleno(doc, e.acento);
    poligono(doc, [[105, 68], [107, 70], [105, 72], [103, 70]], 'F');
    opacidad(doc, 0.55);
    meandro(doc, 14, 82, 182, 3.6, e.acento, 0.3);
    opacidad(doc, 1);
    return 96;
  },

  palestra(ctx) {
    const { doc, e } = ctx;
    relleno(doc, e.banda);
    doc.rect(0, 0, PAG.w, 84, 'F');
    meandro(doc, 12, 9, 186, 6, e.terracota, 0.5);
    meandro(doc, 12, 69, 186, 6, e.terracota, 0.5);
    laurel(doc, 105, 46, 74, 17, Math.PI * 0.62, Math.PI * 1.32, e.terracota);
    laurel(doc, 105, 46, 74, 17, Math.PI * 0.38, -Math.PI * 0.32, e.terracota);
    tituloCentrado(ctx, 30, { colNombre: e.claro, colSobre: e.terracota, colKicker: e.terracota });
    return 96;
  },

  antorchas(ctx) {
    const { doc, e, rnd } = ctx;
    relleno(doc, e.banda);
    doc.rect(0, 0, PAG.w, 86, 'F');
    estrellas(doc, rnd, 0, 2, PAG.w, 80, 90, '#FFFFFF');
    antorcha(doc, 26, 34, e);
    antorcha(doc, PAG.w - 26, 34, e);
    // El anillo de Giges
    trazo(doc, e.oro);
    doc.setLineWidth(1.3);
    doc.circle(105, 20, 6.2, 'S');
    doc.setLineWidth(0.25);
    trazo(doc, '#FFF1C2');
    doc.circle(105, 20, 5.1, 'S');
    relleno(doc, '#CFE8FF');
    trazo(doc, e.oro);
    doc.setLineWidth(0.5);
    poligono(doc, [[105, 11.2], [107.4, 13.8], [105, 16], [102.6, 13.8]], 'FD');
    tituloCentrado(ctx, 38, { colNombre: e.claro, colSobre: e.oro, colKicker: e.oro });
    trazo(doc, e.oro);
    doc.setLineWidth(0.8);
    doc.line(0, 86, PAG.w, 86);
    return 98;
  },

  cyber(ctx) {
    const { doc, e, d, rnd } = ctx;
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    for (let x = 4; x < PAG.w; x += 4.2) {
      for (let y = 5; y < 80; y += 3.6) {
        if (rnd() < 0.45) continue;
        opacidad(doc, 0.06 + rnd() * 0.32);
        color(doc, rnd() < 0.12 ? e.cian : e.acento);
        doc.text(rnd() < 0.5 ? '0' : '1', x, y);
      }
    }
    opacidad(doc, 0.9);
    relleno(doc, e.fondo);
    doc.rect(14, 16, 182, 56, 'F');
    opacidad(doc, 1);
    trazo(doc, e.cian);
    doc.setLineWidth(0.3);
    doc.rect(14, 16, 182, 56, 'S');
    relleno(doc, e.cian);
    for (const [x, y] of [[14, 16], [196, 16], [14, 72], [196, 72]]) doc.rect(x - 1, y - 1, 2, 2, 'F');
    texto(doc, `> dialogo_socratico --tema=${d.tema.id}`, 21, 27, { fuente: 'courier', tam: 9, col: e.cian });
    const tam = tamQueCabe(doc, d.nombre, 'courier', 'bold', 30, 140);
    texto(doc, d.nombre, 21, 44, { fuente: 'courier', estilo: 'bold', tam, col: e.acento });
    relleno(doc, e.acento);
    doc.rect(21 + doc.getTextWidth(seguro(d.nombre)) + 2, 44 - tam * PT * 0.7, tam * PT * 0.5, tam * PT * 0.75, 'F');
    texto(doc, d.tema.sobre, 21, 55, { fuente: 'courier', tam: 12, col: e.tinta });
    texto(doc, '[ NEO-ATENAS :: 2077 ]', 21, 65, { fuente: 'courier', estilo: 'bold', tam: 8, col: e.acento2 });
    // pistas de circuito
    trazo(doc, e.cian);
    doc.setLineWidth(0.35);
    relleno(doc, e.cian);
    for (const [x, y, dx, dy] of [[150, 24, 18, -8], [158, 62, 22, 8], [140, 40, 30, 0]]) {
      doc.line(x, y, x + dx * 0.6, y);
      doc.line(x + dx * 0.6, y, x + dx, y + dy);
      doc.circle(x + dx, y + dy, 0.9, 'F');
      doc.circle(x, y, 0.6, 'F');
    }
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.line(14, 82, 196, 82);
    doc.setLineDashPattern([], 0);
    return 94;
  },

  neon(ctx) {
    const { doc, e, d } = ctx;
    const horizonte = 58;
    degradado(doc, 0, 0, PAG.w, horizonte, [
      [0, '#1B0B3A'], [0.5, '#5B1A7A'], [0.8, '#D93A86'], [1, '#FF8A5B'],
    ]);
    // Sol vaporwave: franjas horizontales con huecos en la mitad inferior
    const [cx, cy, r] = [160, horizonte - 2, 24];
    for (let y = cy - r; y < cy; y += 0.5) {
      const dy = cy - y;
      if (dy < 12 && Math.floor(dy * 1.2) % 3 === 0) continue;
      const media = Math.sqrt(r * r - dy * dy);
      relleno(doc, mezcla('#FFE66D', '#FF4FA3', (y - (cy - r)) / r));
      doc.rect(cx - media, y, media * 2, 0.55, 'F');
    }
    relleno(doc, e.noche);
    doc.rect(0, horizonte, PAG.w, 30, 'F');
    trazo(doc, e.rosa);
    doc.setLineWidth(0.35);
    for (let k = 1; k <= 8; k++) {
      const y = horizonte + 30 * (k / 8) ** 2;
      doc.line(0, y, PAG.w, y);
    }
    for (let j = -10; j <= 10; j++) doc.line(105, horizonte, 105 + j * 22, horizonte + 30);
    trazo(doc, e.cian);
    doc.setLineWidth(0.7);
    doc.line(0, horizonte, PAG.w, horizonte);
    relleno(doc, '#FF3355');
    doc.circle(19.5, 17.2, 1.3, 'F');
    texto(doc, 'EN DIRECTO  ·  DIÁLOGO SOCRÁTICO', 23, 18.4, { fuente: 'helvetica', estilo: 'bold', tam: 8.5, col: e.cian, espaciado: 0.6 });
    const tam = tamQueCabe(doc, d.nombre, 'helvetica', 'bold', 32, 120);
    texto(doc, d.nombre, 18.8, 35.8, { fuente: 'helvetica', estilo: 'bold', tam, col: e.rosa });
    texto(doc, d.nombre, 18, 35, { fuente: 'helvetica', estilo: 'bold', tam, col: '#FFFFFF' });
    texto(doc, d.tema.sobre, 18, 45, { fuente: 'helvetica', estilo: 'italic', tam: 14, col: '#FFE3F6' });
    return 100;
  },
};

// Cabecera discreta de las páginas siguientes.
function cabeceraContinua(ctx) {
  const { doc, e, d, rnd } = ctx;
  const titulo = `${d.nombre}, ${d.tema.sobre}`;
  const t = d.tema.tema;
  if (t === 'agora') {
    meandro(doc, 14, 9, 182, 3.6, e.acento, 0.3);
  } else if (t === 'palestra') {
    relleno(doc, e.banda);
    doc.rect(0, 0, PAG.w, 13, 'F');
    meandro(doc, 12, 4, 186, 4, e.terracota, 0.35);
  } else if (t === 'antorchas') {
    relleno(doc, e.banda);
    doc.rect(0, 0, PAG.w, 13, 'F');
    estrellas(doc, rnd, 0, 1, PAG.w, 11, 25, '#FFFFFF');
    trazo(doc, e.oro);
    doc.setLineWidth(0.6);
    doc.line(0, 13, PAG.w, 13);
  } else if (t === 'cyber') {
    texto(doc, `> ${d.nombre.toLowerCase()}.dialogo`, M.izq, 12, { fuente: 'courier', tam: 8, col: e.cian });
    trazo(doc, e.cian);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.line(14, 15, 196, 15);
    doc.setLineDashPattern([], 0);
  } else if (t === 'neon') {
    degradado(doc, 0, 0, PAG.w, 7, [[0, '#5B1A7A'], [0.6, '#D93A86'], [1, '#FF8A5B']]);
  }
  texto(doc, titulo, PAG.w - M.der, t === 'agora' ? 20 : 19.5, {
    fuente: e.fuente, estilo: 'italic', tam: 8.5, col: e.suave, align: 'right',
  });
  return M.sup + 2;
}

function pies(ctx) {
  const { doc, e } = ctx;
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    trazo(doc, e.regla);
    doc.setLineWidth(0.3);
    doc.line(M.izq, PAG.h - 15, PAG.w - M.der, PAG.h - 15);
    texto(doc, 'Diálogo socrático · Filosofía 4.º ESO · IES San Nicolás', M.izq, PAG.h - 10, {
      fuente: e.fuente, tam: 7.5, col: e.suave,
    });
    texto(doc, `${i} / ${total}`, PAG.w - M.der, PAG.h - 10, { fuente: e.fuente, tam: 7.5, col: e.suave, align: 'right' });
  }
}

// ---------- maquetación de texto con marcas ----------

function fuenteDe(e, estilo) {
  if (estilo === 'etiquetaS' || estilo === 'etiquetaA' || estilo === 'negrita') return 'bold';
  if (estilo === 'cursiva') return 'italic';
  return 'normal';
}

function colorDe(e, estilo) {
  if (estilo === 'etiquetaS') return e.acento;
  if (estilo === 'etiquetaA') return e.acento2;
  if (estilo === 'suave' || estilo === 'cursiva') return e.suave;
  return e.tinta;
}

function nuevaPagina(ctx) {
  ctx.doc.addPage();
  fondo(ctx);
  ctx.y = cabeceraContinua(ctx);
}

function asegurar(ctx, alto) {
  if (ctx.y + alto > PAG.h - M.inf) nuevaPagina(ctx);
}

// Escribe un párrafo con estilos mezclados, saltos de línea y de página.
function parrafo(ctx, piezas, { x = M.izq, ancho = ANCHO, tam = ctx.e.tam, interlineado = 1.45, alPrimeraLinea } = {}) {
  const { doc, e } = ctx;
  const lh = tam * PT * interlineado;
  const medir = (t) => {
    doc.setFont(e.fuente, fuenteDe(e, t.estilo));
    doc.setFontSize(tam);
    return doc.getTextWidth(t.texto);
  };

  const tokens = [];
  for (const p of piezas) {
    for (const parte of seguro(p.texto).split(/(\n| +)/)) {
      if (!parte) continue;
      if (parte === '\n') tokens.push({ salto: true });
      else if (parte.trim() === '') tokens.push({ texto: ' ', estilo: p.estilo, espacio: true });
      else tokens.push({ texto: parte, estilo: p.estilo });
    }
  }

  const lineas = [];
  let linea = [];
  let ocupado = 0;
  const cerrar = () => {
    while (linea.length && linea.at(-1).espacio) ocupado -= linea.pop().ancho;
    lineas.push(linea);
    linea = [];
    ocupado = 0;
  };
  for (const t of tokens) {
    if (t.salto) {
      cerrar();
      continue;
    }
    if (t.espacio && linea.length === 0) continue;
    t.ancho = medir(t);
    if (!t.espacio && ocupado + t.ancho > ancho && linea.length) cerrar();
    if (!t.espacio && t.ancho > ancho) {
      let resto = t.texto; // palabra más larga que la línea: se trocea
      while (resto) {
        let n = resto.length;
        while (n > 1 && medir({ ...t, texto: resto.slice(0, n) }) > ancho - ocupado) n--;
        const trozo = { ...t, texto: resto.slice(0, n) };
        trozo.ancho = medir(trozo);
        linea.push(trozo);
        ocupado += trozo.ancho;
        resto = resto.slice(n);
        if (resto) cerrar();
      }
      continue;
    }
    linea.push(t);
    ocupado += t.ancho;
  }
  if (linea.length) cerrar();

  lineas.forEach((ln, i) => {
    if (ctx.y + lh > PAG.h - M.inf) nuevaPagina(ctx);
    const base = ctx.y + lh * 0.72;
    if (i === 0 && alPrimeraLinea) alPrimeraLinea(base);
    // Agrupa palabras del mismo estilo en tramos. El resaltado cubre solo la parte
    // visible; el texto se escribe con sus espacios para que se copie bien.
    const tramos = [];
    for (const t of ln) {
      const prev = tramos.at(-1);
      if (prev && prev.estilo === t.estilo) prev.tokens.push(t);
      else tramos.push({ estilo: t.estilo, tokens: [t] });
    }
    let xx = x;
    for (const tr of tramos) {
      const fs = tam * PT;
      const ancho = tr.tokens.reduce((s, t) => s + t.ancho, 0);
      let ini = 0;
      let fin = tr.tokens.length;
      let antes = 0;
      let despues = 0;
      while (ini < fin && tr.tokens[ini].espacio) antes += tr.tokens[ini++].ancho;
      while (fin > ini && tr.tokens[fin - 1].espacio) despues += tr.tokens[--fin].ancho;
      const visible = tr.tokens.slice(ini, fin).map((t) => t.texto).join('');
      const anchoVisible = ancho - antes - despues;
      const x0 = xx + antes;
      if (visible && (tr.estilo === 'may' || tr.estilo === 'iro')) {
        relleno(doc, tr.estilo === 'may' ? e.may : e.iro);
        doc.rect(x0 - 0.2, base - fs * 0.8, anchoVisible + 0.4, fs * 1.06, 'F');
      }
      if (visible) {
        doc.setFont(e.fuente, fuenteDe(e, tr.estilo));
        doc.setFontSize(tam);
        color(doc, colorDe(e, tr.estilo));
        doc.text(tr.tokens.map((t) => t.texto).join(''), xx, base);
      }
      if (visible && tr.estilo === 'iro') {
        trazo(doc, e.iroLinea);
        doc.setLineWidth(0.3);
        doc.line(x0, base + fs * 0.16, x0 + anchoVisible, base + fs * 0.16);
      }
      xx += ancho;
    }
    ctx.y += lh;
  });
}

// ---------- secciones ----------

function fondo(ctx) {
  relleno(ctx.doc, ctx.e.fondo);
  ctx.doc.rect(0, 0, PAG.w, PAG.h, 'F');
}

function presentacion(ctx) {
  const { doc, e, d } = ctx;
  const fecha = d.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const x = e.centrado ? PAG.w / 2 : M.izq;
  const align = e.centrado ? 'center' : 'left';
  texto(doc, `Filosofía · 4.º ESO · IES San Nicolás · ${fecha}`, x, ctx.y, { fuente: e.fuente, tam: 9.5, col: e.suave, align });
  ctx.y += 7;
  doc.setFont(e.fuente, 'italic');
  doc.setFontSize(11);
  const escena = doc.splitTextToSize(seguro(conNombre(d.tema.escenaPdf, d.nombre)), ANCHO - 10);
  color(doc, e.suave);
  doc.text(escena, x, ctx.y, { align });
  ctx.y += escena.length * 11 * PT * 1.4 + 4;
}

function hito(ctx, fase) {
  const { doc, e } = ctx;
  asegurar(ctx, 16);
  ctx.y += 2.5;
  const etiqueta = `${ROMANOS[fase]} · ${FASES[fase - 1].nombre.toUpperCase()}`;
  doc.setFont(e.fuente, 'bold');
  doc.setFontSize(8.5);
  const ancho = doc.getTextWidth(seguro(etiqueta)) + 0.9 * (etiqueta.length - 1);
  texto(doc, etiqueta, PAG.w / 2, ctx.y + 3, { fuente: e.fuente, estilo: 'bold', tam: 8.5, col: e.acento, align: 'center', espaciado: 0.9 });
  trazo(doc, e.regla);
  doc.setLineWidth(0.3);
  doc.line(M.izq, ctx.y + 2, PAG.w / 2 - ancho / 2 - 4, ctx.y + 2);
  doc.line(PAG.w / 2 + ancho / 2 + 4, ctx.y + 2, PAG.w - M.der, ctx.y + 2);
  ctx.y += 9;
}

function dialogo(ctx) {
  const { doc, e, d } = ctx;
  const etiquetaAlumno = `${d.nombre.toLocaleUpperCase('es')}.`;
  const zona = PAG.h - M.inf - M.sup;
  let faseMax = 0;
  for (const m of d.mensajes) {
    const esSocrates = m.rol === 'socrates';
    const fase = esSocrates ? Math.max(faseMax, m.fase || (faseMax === 0 ? 1 : faseMax)) : faseMax;
    if (esSocrates && fase > faseMax) {
      for (let f = faseMax + 1; f <= fase; f++) hito(ctx, f);
      faseMax = fase;
    }
    const piezas = [{ texto: `${esSocrates ? 'SÓCRATES.' : etiquetaAlumno} `, estilo: esSocrates ? 'etiquetaS' : 'etiquetaA' }];
    if (esSocrates) {
      for (const s of segmentos(m.texto, d.nombre)) {
        piezas.push({ texto: s.texto, estilo: d.marcas && s.marca ? s.marca : 'normal' });
      }
    } else {
      piezas.push({ texto: m.texto, estilo: 'normal' });
    }
    parrafo(ctx, piezas, {
      // Numeración al margen al estilo de Stephanus: página + sección a-e.
      alPrimeraLinea: (base) => {
        const pagina = doc.getCurrentPageInfo().pageNumber;
        const letra = 'abcde'[Math.min(4, Math.max(0, Math.floor(((base - M.sup) / zona) * 5)))];
        texto(doc, `${pagina}${letra}`, M.izq - 4, base, { fuente: e.fuente, estilo: 'italic', tam: 7.5, col: e.suave, align: 'right' });
      },
    });
    ctx.y += 2;
  }
}

function tituloSeccion(ctx, titulo) {
  const { doc, e } = ctx;
  texto(doc, titulo.toUpperCase(), M.izq, ctx.y, { fuente: e.fuente, estilo: 'bold', tam: 9, col: e.acento, espaciado: 0.8 });
  trazo(doc, e.regla);
  doc.setLineWidth(0.3);
  doc.line(M.izq, ctx.y + 2, PAG.w - M.der, ctx.y + 2);
  ctx.y += 8;
}

function resumen(ctx) {
  const { doc, e, d } = ctx;
  asegurar(ctx, 92);
  ctx.y += 6;
  tituloSeccion(ctx, 'Camino de la sabiduría');

  const paso = ANCHO / 4;
  const yNodos = ctx.y + 3;
  trazo(doc, e.regla);
  doc.setLineWidth(0.6);
  doc.line(M.izq + paso / 2, yNodos, M.izq + paso * 3.5, yNodos);
  FASES.forEach((f, i) => {
    const x = M.izq + paso * (i + 0.5);
    const alcanzada = f.n <= d.fase;
    trazo(doc, e.acento);
    relleno(doc, alcanzada ? e.acento : e.fondo);
    doc.setLineWidth(0.5);
    doc.circle(x, yNodos, 2.6, 'FD');
    texto(doc, ROMANOS[f.n], x, yNodos + 1, {
      fuente: e.fuente, estilo: 'bold', tam: 7, col: alcanzada ? e.fondo : e.acento, align: 'center',
    });
    texto(doc, f.nombre, x, yNodos + 8, {
      fuente: e.fuente, estilo: alcanzada ? 'bold' : 'normal', tam: 9, col: alcanzada ? e.tinta : e.suave, align: 'center',
    });
  });
  ctx.y = yNodos + 16;

  tituloSeccion(ctx, 'Logros');
  const col = ANCHO / 2;
  LOGROS.forEach((l, i) => {
    const x = M.izq + (i % 2) * col;
    const y = ctx.y + Math.floor(i / 2) * 9.5;
    const veces = d.logros[l.id] || 0;
    trazo(doc, e.acento);
    relleno(doc, veces ? e.acento : e.fondo);
    doc.setLineWidth(0.4);
    poligono(doc, [[x + 1.8, y - 3.2], [x + 3.6, y - 1.4], [x + 1.8, y + 0.4], [x, y - 1.4]], 'FD');
    texto(doc, veces ? `${l.nombre}  ×${veces}` : l.nombre, x + 6, y, {
      fuente: e.fuente, estilo: 'bold', tam: 9.5, col: veces ? e.tinta : e.suave,
    });
    texto(doc, l.desc, x + 6, y + 4, { fuente: e.fuente, tam: 7.5, col: e.suave });
  });
  ctx.y += 4 * 9.5 + 3;

  const intervenciones = d.mensajes.filter((m) => m.rol === 'alumno').length;
  const minutos = Math.max(1, Math.round((d.mensajes.at(-1).t - d.mensajes[0].t) / 60000)) || 1;
  parrafo(ctx, [
    { texto: 'Intervenciones: ', estilo: 'negrita' }, { texto: `${intervenciones}   ·   `, estilo: 'normal' },
    { texto: 'Pistas pedidas: ', estilo: 'negrita' }, { texto: `${d.pistas}   ·   `, estilo: 'normal' },
    { texto: 'Puntos de sabiduría: ', estilo: 'negrita' }, { texto: `${d.puntos}   ·   `, estilo: 'normal' },
    { texto: 'Duración: ', estilo: 'negrita' }, { texto: `${minutos} min`, estilo: 'normal' },
  ], { tam: 9.5 });

  if (d.reflexion?.trim()) {
    ctx.y += 5;
    asegurar(ctx, 24);
    tituloSeccion(ctx, `Reflexión final de ${d.nombre}`);
    parrafo(ctx, [{ texto: d.reflexion.trim(), estilo: 'cursiva' }]);
  }
}

function leyenda(ctx) {
  const { d } = ctx;
  ctx.y += 6;
  asegurar(ctx, 26);
  if (d.marcas) {
    parrafo(ctx, [
      { texto: 'Leyenda. ', estilo: 'negrita' },
      { texto: 'Azul: mayéutica', estilo: 'may' },
      { texto: `, preguntas con las que Sócrates guía a ${d.nombre} a examinar su idea. `, estilo: 'normal' },
      { texto: 'Naranja subrayado: ironía', estilo: 'iro' },
      { texto: ', ignorancia fingida, elogio exagerado o sorpresa fingida para provocar la reflexión (aunque tenga forma de pregunta). Es una lectura interpretativa.', estilo: 'normal' },
    ], { tam: 8.5 });
    ctx.y += 2;
  }
  parrafo(ctx, [{
    texto: 'Los números al margen (1a, 1b…) imitan la numeración de Stephanus con la que se citan los diálogos de Platón. Sócrates es un personaje interpretado por inteligencia artificial en la actividad «Diálogo socrático» de Filosofía de 4.º ESO del IES San Nicolás.',
    estilo: 'cursiva',
  }], { tam: 7.5 });
}

// ---------- punto de entrada ----------

export function nombreFichero(d) {
  const limpio = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Dialogo-socratico_${limpio(d.nombre)}_${d.tema.id}.pdf`;
}

/**
 * @param {typeof import('jspdf').jsPDF} JsPDF
 * @param {{nombre:string, tema:object, mensajes:Array, fase:number, logros:Object<string,number>,
 *   puntos:number, pistas:number, reflexion?:string, marcas:boolean, fecha:Date}} d
 */
export function crearPdf(JsPDF, d) {
  const doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
  const e = ESTILOS[d.tema.tema];
  const ctx = { doc, e, d, y: 0, rnd: semilla(d.nombre + d.tema.id) };
  doc.setProperties({
    title: seguro(`${d.nombre}, ${d.tema.sobre}`),
    subject: seguro(d.tema.pregunta),
    author: seguro(d.nombre),
    creator: 'Diálogo socrático · IES San Nicolás',
  });
  fondo(ctx);
  ctx.y = PORTADAS[d.tema.tema](ctx);
  presentacion(ctx);
  dialogo(ctx);
  resumen(ctx);
  leyenda(ctx);
  pies(ctx);
  return doc;
}
