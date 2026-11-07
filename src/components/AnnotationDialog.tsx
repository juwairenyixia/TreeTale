import { useEffect, useRef, useState } from 'react';
import type { TaxonMeta, TaxonPhoto } from '../types';
import { Modal } from './Modal';

interface AnnotationDialogProps {
  open: boolean;
  taxonName: string | null;
  metadata?: TaxonMeta;
  onClose: () => void;
  onSave: (patch: TaxonMeta) => void;
}

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
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
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoSource, setPhotoSource] = useState('');
  const [photoCredit, setPhotoCredit] = useState('');
  const [photoLicense, setPhotoLicense] = useState('');
  const [photoPage, setPhotoPage] = useState('');
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setCn(metadata?.cn ?? '');
    setGroup(metadata?.group ?? '');
    setHabitat(metadata?.habitat ?? '');
    setNote(metadata?.note ?? '');
    const photo = metadata?.photo;
    setPhotoUrl(photo?.url ?? '');
    setPhotoSource(photo?.source ?? '');
    setPhotoCredit(photo?.credit ?? '');
    setPhotoLicense(photo?.license ?? '');
    setPhotoPage(photo?.pageUrl ?? '');
    setPhotoError('');
  }, [open, taxonName, metadata]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('请选择图片文件（JPG / PNG / WebP）。');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setPhotoError('图片超过 3 MB，请先压缩后再上传。');
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setPhotoUrl(dataUrl);
      setPhotoSource('本地图片');
      setPhotoLicense('');
      setPhotoPage('');
      setPhotoError('');
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : '读取图片失败');
    }
  };

  const submit = () => {
    let photo: TaxonPhoto | undefined;
    if (photoUrl.trim()) {
      photo = {
        url: photoUrl.trim(),
        source: photoSource.trim() || undefined,
        credit: photoCredit.trim() || undefined,
        license: photoLicense.trim() || undefined,
        pageUrl: photoPage.trim() || undefined,
      };
    }
    const patch: TaxonMeta = {
      cn: cn.trim() || undefined,
      group: group.trim() || undefined,
      habitat: habitat.trim() || undefined,
      note: note.trim() || undefined,
      photo,
    };
    onSave(patch);
  };

  return (
    <Modal
      open={open}
      title="编辑物种资料"
      eyebrow={taxonName ? `物种 / ${taxonName.replace(/_/g, ' ')}` : '物种注释'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            取消
          </button>
          <button className="btn btn--dark btn--sm" onClick={submit} disabled={!cn.trim()}>
            保存
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

      <section className="photo-editor">
        <div className="photo-editor__head">
          <h3>代表照片</h3>
          <span>用于告诉读者这个物种长什么样</span>
        </div>

        <div className="photo-editor__body">
          <div className="photo-editor__preview">
            {photoUrl ? (
              <img src={photoUrl} alt="照片预览" />
            ) : (
              <div className="photo-editor__empty">尚未设置照片</div>
            )}
          </div>

          <div className="photo-editor__fields">
            <button className="annotation-tool annotation-tool--wide" onClick={() => fileRef.current?.click()}>
              上传本地图片（≤ 3 MB）
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleUpload(event.target.files?.[0]);
                event.target.value = '';
              }}
            />

            <label className="form-field">
              <span>图片地址</span>
              <input
                value={photoUrl.startsWith('data:') ? '' : photoUrl}
                onChange={(event) => {
                  setPhotoUrl(event.target.value);
                  setPhotoError('');
                }}
                placeholder={photoUrl.startsWith('data:') ? '已使用本地图片' : 'https://…'}
              />
            </label>
            <div className="form-grid form-grid--tight">
              <label className="form-field">
                <span>来源</span>
                <input
                  value={photoSource}
                  onChange={(event) => setPhotoSource(event.target.value)}
                  placeholder="例如：iNaturalist / 自摄"
                />
              </label>
              <label className="form-field">
                <span>许可协议</span>
                <input
                  value={photoLicense}
                  onChange={(event) => setPhotoLicense(event.target.value)}
                  placeholder="例如：CC BY-NC"
                />
              </label>
            </div>
            <label className="form-field">
              <span>作者 / 版权</span>
              <input
                value={photoCredit}
                onChange={(event) => setPhotoCredit(event.target.value)}
                placeholder="例如：摄影者姓名"
              />
            </label>
            <label className="form-field">
              <span>原始页面</span>
              <input
                value={photoPage}
                onChange={(event) => setPhotoPage(event.target.value)}
                placeholder="https://…"
              />
            </label>
            {photoUrl && (
              <button
                className="reset-link"
                onClick={() => {
                  setPhotoUrl('');
                  setPhotoSource('');
                  setPhotoCredit('');
                  setPhotoLicense('');
                  setPhotoPage('');
                }}
              >
                移除照片
              </button>
            )}
          </div>
        </div>

        {photoError && <p className="form-error">{photoError}</p>}
        <p className="form-hint">
          上传的图片会以 data URL 形式保存在本地工作区；引用网络图片时请填写来源和许可，便于核对版权。
        </p>
      </section>

      <p className="form-hint">
        保存后会立即更新树、图例、比较页和导出内容，并自动保存到浏览器。
      </p>
    </Modal>
  );
}
