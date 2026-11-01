import { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { Image, FileText } from 'lucide-react';
import { Modal } from './Modal';
import {
  exportPng,
  exportSvg,
  exportSvgDataUrl,
  getFullExportBox,
  parseViewBox,
  type ExportBackground,
} from '../lib/export';

interface ExportDialogProps {
  open: boolean;
  name: string;
  svgRef: RefObject<SVGSVGElement | null>;
  onClose: () => void;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type ExportFormat = 'svg' | 'png';
type ExportScope = 'full' | 'current';

export function ExportDialog({ open, name, svgRef, onClose, notify }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('svg');
  const [scope, setScope] = useState<ExportScope>('full');
  const [background, setBackground] = useState<ExportBackground>('paper');
  const [scale, setScale] = useState(2);
  const [showSupport, setShowSupport] = useState(true);
  const [showCladeLabels, setShowCladeLabels] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setScope(svgRef.current?.getAttribute('data-full-viewbox') ? 'full' : 'current');
    setBusy(false);
  }, [open, svgRef]);

  const dimensions = useMemo(() => {
    const svg = svgRef.current;
    if (!svg) return null;
    const full = getFullExportBox(svg);
    if (scope === 'full' && full) {
      return { width: full.width, height: full.height, viewBox: full.viewBox };
    }
    const box = svg.viewBox.baseVal;
    const viewBox = `${box.x} ${box.y} ${box.width} ${box.height}`;
    const size = parseViewBox(viewBox);
    return size ? { ...size, viewBox } : null;
  }, [open, scope, svgRef]);

  useEffect(() => {
    if (!open || !dimensions || !svgRef.current) {
      setPreviewUrl(null);
      return;
    }
    try {
      setPreviewUrl(
        exportSvgDataUrl(svgRef.current, {
          width: dimensions.width,
          height: dimensions.height,
          viewBox: dimensions.viewBox,
          background: 'paper',
          showSupport,
          showCladeLabels,
        }),
      );
    } catch {
      setPreviewUrl(null);
    }
  }, [open, dimensions, showSupport, showCladeLabels, svgRef]);

  const runExport = async () => {
    const svg = svgRef.current;
    if (!svg || !dimensions) {
      notify('当前没有可导出的画布。', 'error');
      return;
    }
    setBusy(true);
    try {
      const options = {
        width: dimensions.width,
        height: dimensions.height,
        viewBox: dimensions.viewBox,
        background,
        scale,
        showSupport,
        showCladeLabels,
      };
      if (format === 'svg') {
        exportSvg(svg, name, options);
        notify('SVG 已导出。', 'success');
      } else {
        await exportPng(svg, name, options);
        notify(`PNG 已按 ${scale}× 导出。`, 'success');
      }
      onClose();
    } catch {
      notify(format === 'png' ? 'PNG 导出失败，请改用 SVG。' : 'SVG 导出失败。', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="出版级导出"
      eyebrow="EXPORT STUDIO"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            取消
          </button>
          <button className="btn btn--dark btn--sm" onClick={() => void runExport()} disabled={busy}>
            {busy ? '正在生成…' : `导出 ${format.toUpperCase()}`}
          </button>
        </>
      }
    >
      <div className="export-dialog">
        <div className="export-preview">
          <div className="export-preview__paper">
            {previewUrl ? (
              <img src={previewUrl} alt={`${name} 导出预览`} />
            ) : (
              <>
                <span>TreeTale</span>
                <strong>{name}</strong>
                <small>
                  {dimensions ? `${Math.round(dimensions.width)} × ${Math.round(dimensions.height)}` : '—'}
                </small>
              </>
            )}
          </div>
        </div>

        <div className="export-controls">
          <div className="field">
            <span>格式</span>
            <div className="segmented">
              <button className={format === 'svg' ? 'is-active' : ''} onClick={() => setFormat('svg')}>
                <FileText size={14} /> SVG
              </button>
              <button className={format === 'png' ? 'is-active' : ''} onClick={() => setFormat('png')}>
                <Image size={14} /> PNG
              </button>
            </div>
          </div>

          <div className="field">
            <span>范围</span>
            <div className="segmented">
              <button className={scope === 'full' ? 'is-active' : ''} onClick={() => setScope('full')}>
                完整树
              </button>
              <button className={scope === 'current' ? 'is-active' : ''} onClick={() => setScope('current')}>
                当前视图
              </button>
            </div>
          </div>

          <div className="field">
            <span>背景</span>
            <div className="segmented">
              <button
                className={background === 'paper' ? 'is-active' : ''}
                onClick={() => setBackground('paper')}
              >
                纸色
              </button>
              <button
                className={background === 'white' ? 'is-active' : ''}
                onClick={() => setBackground('white')}
              >
                白色
              </button>
              <button
                className={background === 'transparent' ? 'is-active' : ''}
                onClick={() => setBackground('transparent')}
              >
                透明
              </button>
            </div>
          </div>

          {format === 'png' && (
            <label className="field">
              <span>分辨率</span>
              <div className="select-wrap">
                <select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
                  <option value={1}>1×</option>
                  <option value={2}>2×（推荐）</option>
                  <option value={3}>3×（印刷）</option>
                </select>
              </div>
            </label>
          )}

          <div className="toggle-row">
            <div>
              <strong>显示支持度</strong>
              <small>导出时保留内部节点数值</small>
            </div>
            <button
              className={`switch ${showSupport ? 'is-on' : ''}`}
              onClick={() => setShowSupport((value) => !value)}
              aria-pressed={showSupport}
            >
              <span />
            </button>
          </div>

          <div className="toggle-row">
            <div>
              <strong>显示进化枝标签</strong>
              <small>鱼类、哺乳动物等中文标签</small>
            </div>
            <button
              className={`switch ${showCladeLabels ? 'is-on' : ''}`}
              onClick={() => setShowCladeLabels((value) => !value)}
              aria-pressed={showCladeLabels}
            >
              <span />
            </button>
          </div>

          <p className="form-hint">
            “完整树”会忽略当前缩放和拖动；“当前视图”会按屏幕上的范围导出。
          </p>
        </div>
      </div>
    </Modal>
  );
}
