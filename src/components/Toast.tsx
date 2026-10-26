import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 3800);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

  return (
    <div className={`toast toast--${toast.type}`} role="status">
      <Icon size={18} />
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="关闭提示">
        <X size={15} />
      </button>
    </div>
  );
}
