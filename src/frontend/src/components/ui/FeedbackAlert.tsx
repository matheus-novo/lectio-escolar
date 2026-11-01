import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface FeedbackAlertProps {
  variant: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

const VARIANT_STYLES = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-600',
  },
  error: {
    container: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'text-rose-600',
  },
} as const;

export function FeedbackAlert({ variant, message, onDismiss }: FeedbackAlertProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles.container}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} />
        <span className="font-medium">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-0.5 opacity-70 transition hover:opacity-100"
        aria-label="Dispensar mensagem"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

