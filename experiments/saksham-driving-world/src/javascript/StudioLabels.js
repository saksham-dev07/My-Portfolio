import { CanvasTexture, LinearFilter } from 'three';

export function labelTexture(lines, width = 1024, height = 512, { titleSize = 60, detailSize = 31 } = {}) {
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
    ctx.font = `${i === 0 ? 700 : 500} ${size}px system-ui, sans-serif`;
    const fit = Math.min(1, (width - 80) / Math.max(1, ctx.measureText(line).width));
    ctx.font = `${i === 0 ? 700 : 500} ${size * fit}px system-ui, sans-serif`;
    ctx.fillText(line, width / 2, height * (i + 1) / (lines.length + 1));
  });
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}
