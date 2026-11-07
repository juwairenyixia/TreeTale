import { ImageOff } from 'lucide-react';
import type { TaxonPhoto } from '../types';

const LICENSE_LABEL: Record<string, string> = {
  cc0: 'CC0 公共领域',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  'cc-by-nc': 'CC BY-NC',
  'cc-by-nc-sa': 'CC BY-NC-SA',
  'cc-by-nd': 'CC BY-ND',
  'cc-by-nc-nd': 'CC BY-NC-ND',
};

export function licenseLabel(license?: string): string | null {
  if (!license) return null;
  return LICENSE_LABEL[license.toLowerCase()] ?? license.toUpperCase();
}

/** "© A, some rights reserved (CC BY-NC), uploaded by B" -> "A" */
function cleanCredit(attribution?: string): string | null {
  if (!attribution) return null;
  let text = attribution.trim();
  text = text.replace(/^\(c\)\s*/i, '').replace(/^©\s*/, '');
  text = text.replace(/,?\s*uploaded by .*$/i, '');
  text = text.replace(/,?\s*(some|all) rights reserved.*$/i, '');
  text = text.replace(/,\s*\(CC[^)]*\)/gi, '');
  text = text.replace(/^no rights reserved.*$/i, '');
  return text.trim() || null;
}

interface TaxonPhotoCardProps {
  photo?: TaxonPhoto;
  name: string;
  onEdit?: () => void;
  compact?: boolean;
}

export function TaxonPhotoCard({ photo, name, onEdit, compact }: TaxonPhotoCardProps) {
  if (!photo?.url) {
    return (
      <div className={`photo-card photo-card--empty ${compact ? 'is-compact' : ''}`}>
        <div className="photo-card__placeholder">
          <ImageOff size={18} />
          <span>还没有照片</span>
        </div>
        {onEdit && (
          <button className="photo-card__action" onClick={onEdit}>
            添加代表照片
          </button>
        )}
      </div>
    );
  }

  const license = licenseLabel(photo.license);
  const credit = cleanCredit(photo.credit);

  return (
    <figure className={`photo-card ${compact ? 'is-compact' : ''}`}>
      <div className="photo-card__frame">
        <img src={photo.url} alt={`${name} 的代表照片`} loading="lazy" />
      </div>
      <figcaption className="photo-card__meta">
        <span className="photo-card__source">
          {photo.source ?? '图片来源'}
          {license && <b>{license}</b>}
        </span>
        {credit && <span className="photo-card__credit">摄影 / 提供：{credit}</span>}
        {photo.caption && <span className="photo-card__caption">{photo.caption}</span>}
        <span className="photo-card__links">
          {photo.pageUrl && (
            <a href={photo.pageUrl} target="_blank" rel="noreferrer noopener">
              查看原始页面
            </a>
          )}
          {onEdit && (
            <button className="photo-card__edit" onClick={onEdit}>
              更换
            </button>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
