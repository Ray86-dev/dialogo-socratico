// Marcas de lectura: convierte el texto de Sócrates («<may>…</may>», «<iro>…</iro>»)
// en segmentos [{ texto, marca: null | 'may' | 'iro' }]. Nunca se usa innerHTML.

export function conNombre(texto, nombre) {
  return texto.replace(/\{\s*nombre\s*\}/gi, nombre);
}

export function segmentos(texto, nombre) {
  const limpio = conNombre(texto, nombre).replace(/\*\*?/g, '');
  const partes = [];
  let marca = null;
  let ultimo = 0;
  for (const m of limpio.matchAll(/<(\/?)(may|iro)>/g)) {
    if (m.index > ultimo) partes.push({ texto: limpio.slice(ultimo, m.index), marca });
    marca = m[1] ? null : m[2];
    ultimo = m.index + m[0].length;
  }
  if (ultimo < limpio.length) partes.push({ texto: limpio.slice(ultimo), marca });
  // Une segmentos contiguos con la misma marca.
  return partes.reduce((acc, p) => {
    const prev = acc.at(-1);
    if (prev && prev.marca === p.marca) prev.texto += p.texto;
    else acc.push({ ...p });
    return acc;
  }, []);
}

export const textoPlano = (texto, nombre) => segmentos(texto, nombre).map((s) => s.texto).join('');
