import { useEffect, useMemo, useState } from 'react';
import type { TreeRecord } from '../types';
import { matchTaxa } from '../lib/tree';
import { Modal } from './Modal';

interface AliasDialogProps {
  open: boolean;
  left: TreeRecord;
  right: TreeRecord;
  aliases: Record<string, string>;
  onClose: () => void;
  onSave: (aliases: Record<string, string>) => void;
}

export function AliasDialog({
  open,
  left,
  right,
  aliases,
  onClose,
  onSave,
}: AliasDialogProps) {
  const unmatched = useMemo(() => matchTaxa(left.tree, right.tree), [left.tree, right.tree]);
  const [draft, setDraft] = useState<Record<string, string>>(aliases);

  useEffect(() => {
    if (open) setDraft(aliases);
  }, [open, aliases]);

  const rightOptions = useMemo(() => {
    const values = new Set(unmatched.unmatchedRight);
    for (const value of Object.values(aliases)) {
      if (value) values.add(value);
    }
    return [...values].sort();
  }, [unmatched.unmatchedRight, aliases]);

  const update = (leftName: string, rightName: string) => {
    setDraft((current) => {
      const next = { ...current };
      if (rightName) {
        for (const [key, value] of Object.entries(next)) {
          if (key !== leftName && value === rightName) delete next[key];
        }
        next[leftName] = rightName;
      } else {
        delete next[leftName];
      }
      return next;
    });
  };

  return (
    <Modal
      open={open}
      title="匹配物种别名"
      eyebrow="ALIAS MATCHING"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn--dark btn--sm"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            保存匹配
          </button>
        </>
      }
    >
      <p className="form-hint">
        两棵树里同一个物种可能使用了不同名称。把左树名称映射到右树名称后，RF 和连线图会把它们当成同一个物种。
      </p>
      <div className="alias-head">
        <span>左树：{left.name}</span>
        <span>右树：{right.name}</span>
      </div>
      {unmatched.unmatchedLeft.length === 0 ? (
        <div className="empty-state">
          <strong>没有未匹配的物种</strong>
          <p>当前两棵树的共同物种已经全部自动匹配。</p>
        </div>
      ) : (
        <div className="alias-list">
          {unmatched.unmatchedLeft.map((leftName) => {
            const usedByOthers = new Set(
              Object.entries(draft)
                .filter(([key, value]) => key !== leftName && value)
                .map(([, value]) => value),
            );
            const choices = rightOptions.filter(
              (name) => !usedByOthers.has(name) || draft[leftName] === name,
            );
            return (
              <label className="alias-row" key={leftName}>
                <span>
                  <strong>{leftName.replace(/_/g, ' ')}</strong>
                  <small>左树</small>
                </span>
                <i>→</i>
                <span className="select-wrap">
                  <select
                    value={draft[leftName] ?? ''}
                    onChange={(event) => update(leftName, event.target.value)}
                  >
                    <option value="">不匹配</option>
                    {choices.map((name) => (
                      <option key={name} value={name}>
                        {name.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            );
          })}
        </div>
      )}
      {unmatched.unmatchedRight.length > 0 && (
        <p className="form-hint">
          右树还有 {unmatched.unmatchedRight.length} 个物种没有对应名称；可以在上方下拉框中选择。
        </p>
      )}
    </Modal>
  );
}
