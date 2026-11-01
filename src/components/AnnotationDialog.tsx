import { useEffect, useState } from 'react';
import type { TaxonMeta } from '../types';
import { Modal } from './Modal';

interface AnnotationDialogProps {
  open: boolean;
  taxonName: string | null;
  metadata?: TaxonMeta;
  onClose: () => void;
  onSave: (patch: TaxonMeta) => void;
}

export function AnnotationDialog({
  open,
  taxonName,
  metadata,
  onClose,
  onSave,
}: AnnotationDialogProps) {
  const [cn, setCn] = useState('');
  const [group, setGroup] = useState('');
  const [habitat, setHabitat] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setCn(metadata?.cn ?? '');
    setGroup(metadata?.group ?? '');
    setHabitat(metadata?.habitat ?? '');
    setNote(metadata?.note ?? '');
  }, [open, taxonName, metadata]);

  const submit = () => {
    const patch: TaxonMeta = {
      cn: cn.trim() || undefined,
      group: group.trim() || undefined,
      habitat: habitat.trim() || undefined,
      note: note.trim() || undefined,
    };
    onSave(patch);
  };

  return (
    <Modal
      open={open}
      title="编辑中文注释"
      eyebrow={taxonName ? `物种 / ${taxonName.replace(/_/g, ' ')}` : '物种注释'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            取消
          </button>
          <button className="btn btn--dark btn--sm" onClick={submit} disabled={!cn.trim()}>
            保存注释
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="form-field form-field--wide">
          <span>中文名 <b>*</b></span>
          <input
            value={cn}
            onChange={(event) => setCn(event.target.value)}
            placeholder="例如：智人"
            autoFocus
          />
          <small>显示在树标签和检查器标题中。</small>
        </label>
        <label className="form-field">
          <span>类群</span>
          <input
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            placeholder="例如：哺乳类"
          />
        </label>
        <label className="form-field">
          <span>生境</span>
          <input
            value={habitat}
            onChange={(event) => setHabitat(event.target.value)}
            placeholder="例如：陆地"
          />
        </label>
        <label className="form-field form-field--wide">
          <span>一句话说明</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="例如：现代人类，也就是我们自己。"
            rows={3}
          />
        </label>
      </div>
      <p className="form-hint">
        保存后会立即更新树标签、图例、比较页和导出内容，并自动保存到浏览器。
      </p>
    </Modal>
  );
}
