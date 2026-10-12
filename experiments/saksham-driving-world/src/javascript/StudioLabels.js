import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter } from 'three';

function finishTexture(canvas) {
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  return texture;
}

export function labelTexture(lines, width = 1024, height = 512, { titleSize = height * (lines.length === 1 ? .62 : lines.length === 2 ? .34 : .27), detailSize = titleSize * .52 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    const size = i === 0 ? titleSize : detailSize;
    ctx.font = `${i === 0 ? 800 : 600} ${size}px system-ui, sans-serif`;
    const fit = Math.min(1, width * .88 / Math.max(1, ctx.measureText(line).width));
    ctx.font = `${i === 0 ? 800 : 600} ${size * fit}px system-ui, sans-serif`;
    ctx.fillText(line, width / 2, height * (i + 1) / (lines.length + 1));
  });
  return finishTexture(canvas);
}

// A single ground decal carries backing, accent and type. Its footprint stays
// inside the existing label rectangle; no extra geometry or collision is added.
export function plaqueTexture(lines, width = 1024, height = 256, { accent = '#dfbc7b', compact = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const inset = Math.max(4, height * .035);
  ctx.fillStyle = '#18392f';
  ctx.beginPath(); ctx.roundRect(inset, inset, width - inset * 2, height - inset * 2, height * .09); ctx.fill();
  ctx.strokeStyle = '#62806b'; ctx.lineWidth = Math.max(2, height * .012); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillRect(width * .032, height * .22, width * .012, height * .56);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const single = lines.length === 1;
  let titleLines = [lines[0]], titleSize = height * .25;
  if (lines.length > 2) {
    ctx.font = `800 ${titleSize}px system-ui, sans-serif`;
    const words = lines[0].split(' ');
    if (ctx.measureText(lines[0]).width > width * .85 && words.length > 2) {
      // Balance a long project name across two lines instead of shrinking it
      // below the role/technology captions.
      let best = Infinity;
      for (let split = 1; split < words.length; split++) {
        const candidate = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
        const longest = Math.max(...candidate.map(line => ctx.measureText(line).width));
        if (longest < best) { best = longest; titleLines = candidate; }
      }
      titleSize *= Math.min(1, width * .85 / best);
    } else titleSize *= Math.min(1, width * .85 / Math.max(1, ctx.measureText(lines[0]).width));
  }
  lines.forEach((line, i) => {
    if (lines.length > 2 && i === 0) {
      ctx.font = `800 ${titleSize}px system-ui, sans-serif`;
      ctx.fillStyle = '#fff1d7';
      titleLines.forEach((title, row) => ctx.fillText(title, width * .52, height * (titleLines.length === 1 ? .28 : .20 + row * .19)));
      return;
    }
    const size = height * (single ? (compact ? .45 : .5) : i === 0 ? (lines.length > 2 ? .25 : .35) : .17);
    const readableSize = lines.length > 2 ? Math.min(size, titleSize * .58, height * .105) : size;
    ctx.font = `${i === 0 ? 800 : 600} ${readableSize}px system-ui, sans-serif`;
    const fit = Math.min(1, width * .85 / Math.max(1, ctx.measureText(line).width));
    ctx.font = `${i === 0 ? 800 : 600} ${readableSize * fit}px system-ui, sans-serif`;
    ctx.fillStyle = i === 0 ? '#fff1d7' : accent;
    const y = single ? height * .5 : lines.length === 2 ? height * (i === 0 ? .36 : .73) : height * (.43 + i * .19);
    ctx.fillText(line, width * .52, y);
  });
  return finishTexture(canvas);
}
