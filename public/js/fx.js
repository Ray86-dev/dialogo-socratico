// Fondos animados en canvas, uno por ambientación. Ligeros (~30 fps), se pausan
// con la pestaña oculta y respetan «reducir movimiento».

const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function particulas({ n, color, tam, vy, vx = 0, oscila = 0.4, brillo = true, desde = 'todo' }) {
  let lista = [];
  const crear = (w, h, inicial) => ({
    x: Math.random() * w,
    y: inicial || desde === 'todo' ? Math.random() * h : vy < 0 ? h + 10 : -10,
    r: tam[0] + Math.random() * (tam[1] - tam[0]),
    v: 0.5 + Math.random(),
    fase: Math.random() * Math.PI * 2,
    vida: Math.random(),
  });
  return {
    iniciar(w, h) {
      lista = Array.from({ length: n }, () => crear(w, h, true));
    },
    dibujar(ctx, w, h, t) {
      for (const p of lista) {
        p.y += vy * p.v;
        p.x += vx * p.v + Math.sin(t / 1400 + p.fase) * oscila;
        if (p.y < -12 || p.y > h + 12 || p.x < -12 || p.x > w + 12) Object.assign(p, crear(w, h, false));
        const alfa = brillo ? 0.35 + 0.65 * Math.abs(Math.sin(t / 900 + p.fase)) : 1;
        ctx.globalAlpha = alfa * (desde === 'abajo' ? Math.min(1, Math.max(0, p.y / h)) : 1);
        ctx.fillStyle = typeof color === 'function' ? color(p) : color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };
}

function estrellas(n) {
  let lista = [];
  return {
    iniciar(w, h) {
      lista = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.75, r: 0.4 + Math.random() * 1.1, f: Math.random() * 6,
      }));
    },
    dibujar(ctx, w, h, t) {
      ctx.fillStyle = '#FFFFFF';
      for (const s of lista) {
        ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t / 1600 + s.f));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };
}

function lluviaDigital() {
  const simbolos = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ΣΟΦΙΑΛΟΓΟΣ';
  const paso = 16;
  let columnas = [];
  return {
    limpiaConEstela: true,
    iniciar(w, h) {
      columnas = Array.from({ length: Math.ceil(w / paso) }, () => ({ y: Math.random() * h, v: 0.6 + Math.random() * 1.4 }));
    },
    dibujar(ctx, w, h) {
      ctx.fillStyle = 'rgba(3, 8, 6, 0.14)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${paso - 2}px "JetBrains Mono", monospace`;
      columnas.forEach((c, i) => {
        const ch = simbolos[Math.floor(Math.random() * simbolos.length)];
        ctx.fillStyle = Math.random() < 0.04 ? '#2DE2E6' : Math.random() < 0.12 ? '#C4FBDD' : '#39FF8F';
        ctx.fillText(ch, i * paso, c.y);
        c.y += paso * 0.5 * c.v;
        if (c.y > h + paso && Math.random() > 0.96) c.y = -paso;
      });
    },
  };
}

const EFECTOS = {
  portada: () => [particulas({ n: 34, color: '#D4A64A', tam: [0.6, 1.8], vy: -0.18 })],
  agora: () => [particulas({ n: 38, color: '#B8892E', tam: [0.7, 2], vy: -0.16 })],
  palestra: () => [particulas({ n: 40, color: '#E07B39', tam: [0.5, 1.6], vy: 0.05, vx: 0.22, oscila: 0.25 })],
  antorchas: () => [
    estrellas(70),
    particulas({
      n: 34, tam: [0.8, 2.2], vy: -0.55, oscila: 0.7, desde: 'abajo',
      color: (p) => (p.vida < 0.5 ? '#FFB347' : '#FF6A2B'),
    }),
  ],
  cyber: () => [lluviaDigital()],
  neon: () => [estrellas(55)],
};

export function iniciarFx(canvas, tema) {
  const ctx = canvas.getContext('2d');
  const capas = (EFECTOS[tema] || (() => []))();
  const conEstela = capas.some((c) => c.limpiaConEstela);
  let w = 0;
  let h = 0;
  let raf = 0;
  let ultimo = 0;

  const ajustar = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    capas.forEach((c) => c.iniciar(w, h));
    if (conEstela) {
      ctx.fillStyle = '#030806';
      ctx.fillRect(0, 0, w, h);
    }
  };

  const fotograma = (t) => {
    raf = requestAnimationFrame(fotograma);
    if (t - ultimo < 33) return; // ~30 fps
    ultimo = t;
    if (!conEstela) ctx.clearRect(0, 0, w, h);
    capas.forEach((c) => c.dibujar(ctx, w, h, t));
  };

  const visibilidad = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !reducirMovimiento()) raf = requestAnimationFrame(fotograma);
  };

  ajustar();
  if (reducirMovimiento()) {
    capas.forEach((c) => c.dibujar(ctx, w, h, 0)); // una imagen fija
  } else {
    raf = requestAnimationFrame(fotograma);
  }
  window.addEventListener('resize', ajustar);
  document.addEventListener('visibilitychange', visibilidad);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', ajustar);
    document.removeEventListener('visibilitychange', visibilidad);
    ctx.clearRect(0, 0, w, h);
  };
}
