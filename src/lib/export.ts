export type ExportBackground = 'paper' | 'white' | 'transparent';

export interface ExportOptions {
  width: number;
  height: number;
  viewBox?: string;
  background?: ExportBackground;
  scale?: number;
  showSupport?: boolean;
  showCladeLabels?: boolean;
}

const BACKGROUNDS: Record<ExportBackground, string | null> = {
  paper: '#f7f3e9',
  white: '#ffffff',
  transparent: null,
};

const SVG_STYLE = `
  text { font-family: 'Manrope', 'Segoe UI', sans-serif; }
  .tree-link { fill: none; stroke: rgba(16,35,28,.44); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
  .tree-link--highlight { stroke: #1f6f5c; stroke-width: 2.8; }
  .tree-link--muted { opacity: .18; }
  .tree-link--search { stroke: #d96c4b; stroke-width: 3.2; }
  .tree-node { fill: #f7f3e9; stroke: #10231c; stroke-width: 1.5; }
  .tree-node--support { stroke-width: 1.2; }
  .tree-node--selected { fill: #d8f27a; stroke: #10231c; stroke-width: 2.2; }
  .tree-node--muted { opacity: .18; }
  .tip-label { font-size: 14px; font-weight: 600; fill: #10231c; letter-spacing: -.01em; }
  .tip-label--muted { opacity: .18; }
  .tip-label--search { fill: #b84f33; font-weight: 800; }
  .tip-dot { stroke: #f7f3e9; stroke-width: 1.2; }
  .support-label { font-size: 10.5px; font-weight: 700; fill: #6b7e74; letter-spacing: .02em; }
  .support-label--muted { opacity: .18; }
  .clade-label rect { fill: #fffdf7; stroke: rgba(31,111,92,.4); stroke-width: 1; }
  .clade-label circle { fill: #1f6f5c; }
  .clade-label text { fill: #1b4b3e; font-size: 11px; font-weight: 800; letter-spacing: .02em; }
  .clade-label.is-muted { opacity: .18; }
  .clade-label__leader { fill: none; stroke: rgba(31,111,92,.3); stroke-width: 1; stroke-dasharray: 2 4; }
  .circular-ring { fill: none; stroke: rgba(16,35,28,.08); stroke-width: 1; }
  .scale-line { stroke: rgba(16,35,28,.4); stroke-width: 1.2; }
  .scale-label { font-size: 10px; fill: #6b7e74; font-weight: 600; }
  .center-label { font-family: 'Fraunces', Georgia, serif; font-size: 18px; fill: rgba(16,35,28,.28); font-style: italic; }
`;

export function parseViewBox(viewBox: string): { width: number; height: number } | null {
  const values = viewBox.trim().split(/\s+/).map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
  return { width: Math.abs(values[2]), height: Math.abs(values[3]) };
}

export function getFullExportBox(svg: SVGSVGElement): {
  width: number;
  height: number;
  viewBox: string;
} | null {
  const viewBox = svg.getAttribute('data-full-viewbox');
  if (!viewBox) return null;
  const size = parseViewBox(viewBox);
  if (!size) return null;
  return { ...size, viewBox };
}

function cloneSvg(svg: SVGSVGElement, options: ExportOptions): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const background = options.background ?? 'paper';
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(options.width));
  clone.setAttribute('height', String(options.height));
  if (options.viewBox) clone.setAttribute('viewBox', options.viewBox);
  clone.removeAttribute('style');

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = SVG_STYLE;
  clone.insertBefore(style, clone.firstChild);

  if (!options.showSupport) {
    clone.querySelectorAll('.support-label').forEach((node) => node.remove());
  }
  if (!options.showCladeLabels) {
    clone.querySelectorAll('.clade-annotations').forEach((node) => node.remove());
  }

  const fill = BACKGROUNDS[background];
  if (fill) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const size = parseViewBox(options.viewBox ?? `0 0 ${options.width} ${options.height}`);
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(size?.width ?? options.width));
    rect.setAttribute('height', String(size?.height ?? options.height));
    rect.setAttribute('fill', fill);
    clone.insertBefore(rect, style.nextSibling);
  }

  return clone;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'treetale'
  );
}

export function exportSvgDataUrl(svg: SVGSVGElement, options: ExportOptions): string {
  const clone = cloneSvg(svg, options);
  const source = new XMLSerializer().serializeToString(clone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}

export function exportSvg(svg: SVGSVGElement, filename: string, options: ExportOptions): void {
  const clone = cloneSvg(svg, options);
  const source = new XMLSerializer().serializeToString(clone);
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), `${slugify(filename)}.svg`);
}

export async function exportPng(
  svg: SVGSVGElement,
  filename: string,
  options: ExportOptions,
): Promise<void> {
  await document.fonts.ready;
  const clone = cloneSvg(svg, options);
  const source = new XMLSerializer().serializeToString(clone);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const desiredScale = Math.max(1, Math.min(4, options.scale ?? 2));
      const scale = Math.min(desiredScale, 4096 / Math.max(options.width, options.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(options.width * scale);
      canvas.height = Math.round(options.height * scale);
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('无法创建画布'));
        return;
      }
      const fill = BACKGROUNDS[options.background ?? 'paper'];
      if (fill) {
        context.fillStyle = fill;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG 导出失败'));
          return;
        }
        downloadBlob(blob, `${slugify(filename)}.png`);
        resolve();
      }, 'image/png');
    };
    image.onerror = () => reject(new Error('PNG 导出失败'));
    image.src = svgUrl;
  });
}

export function downloadText(text: string, filename: string, type = 'text/plain;charset=utf-8'): void {
  downloadBlob(new Blob([text], { type }), filename);
}
