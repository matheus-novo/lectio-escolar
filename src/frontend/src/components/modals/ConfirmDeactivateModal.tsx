import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { Usuario } from '../../types';

interface ConfirmDeactivateModalProps {
  usuario: Usuario | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (usuario: Usuario) => void;
}

export function ConfirmDeactivateModal({
  usuario,
  isSubmitting,
  onCancel,
  onConfirm,
}: ConfirmDeactivateModalProps) {
  if (!usuario) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-modal-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3
              id="deactivate-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Desativar Conta de Usuário
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar confirmação"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600">
            Tem certeza de que deseja desativar logicamente o acesso do usuário{' '}
            <strong className="font-semibold text-slate-900">{usuario.nome}</strong> (
            <span className="text-slate-700">{usuario.email}</span>)?
          </p>
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Após a desativação, este usuário não poderá acessar a Biblioteca Pública
            Virtual, mas os materiais compartilhados e registros permanecerão preservados.
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(usuario)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-2xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Desativando...</span>
                </>
              ) : (
                <span>Confirmar Desativação</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

