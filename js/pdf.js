// Escritor mínimo de PDF: una página por cada JPEG, sin dependencias.
export function buildPdf(images) {
  const enc = new TextEncoder();
  const chunks = [];
  let length = 0;
  const offsets = [];
  const write = (part) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (num, ...parts) => {
    offsets[num] = length;
    write(`${num} 0 obj\n`);
    parts.forEach(write);
    write('\nendobj\n');
  };

  const pageNum = (i) => 3 + i * 3;
  write('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const kids = images.map((_, i) => `${pageNum(i)} 0 R`).join(' ');
  object(2, `<< /Type /Pages /Kids [${kids}] /Count ${images.length} >>`);

  images.forEach(({ bytes, w, h }, i) => {
    const scale = 842 / Math.max(w, h);
    const pw = +(w * scale).toFixed(2);
    const ph = +(h * scale).toFixed(2);
    const n = pageNum(i);
    object(n,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] ` +
      `/Resources << /XObject << /Im0 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`);
    const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    object(n + 1, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    object(n + 2,
      `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB ` +
      `/BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,
      bytes,
      '\nendstream');
  });

  const xrefAt = length;
  const count = offsets.length;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  write(`${xref}trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}
