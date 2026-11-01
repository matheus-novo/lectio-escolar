import { AlertCircle, Loader2, School, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { extractErrorMessage } from '../../services/api';
import { turmaService } from '../../services/turmaService';
import { normalizeTurno, TURNOS, type Turma, type Turno } from '../../types';

interface TurmaModalProps {
  isOpen: boolean;
  turmaToEdit: Turma | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface TurmaFormErrors {
  nome?: string;
  anoLetivo?: string;
  turno?: string;
}

const MIN_ANO_LETIVO = 2000;
const MAX_ANO_LETIVO = 2100;

interface TurmaFormContentProps {
  turmaToEdit: Turma | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function TurmaFormContent({ turmaToEdit, onClose, onSuccess }: TurmaFormContentProps) {
  const isEditMode = turmaToEdit !== null;

  const [nome, setNome] = useState<string>(turmaToEdit?.nome ?? '');
  const [anoLetivo, setAnoLetivo] = useState<string>(
    String(turmaToEdit?.anoLetivo ?? new Date().getFullYear())
  );
  const [turno, setTurno] = useState<Turno | ''>(
    turmaToEdit ? (normalizeTurno(turmaToEdit.turno) ?? '') : 'Manhã'
  );
  const [ativo, setAtivo] = useState<boolean>(turmaToEdit?.ativo ?? true);

  const [fieldErrors, setFieldErrors] = useState<TurmaFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validate = (): boolean => {
    const errors: TurmaFormErrors = {};
    const parsedAno = Number(anoLetivo);

    if (!nome.trim()) {
      errors.nome = 'Informe o nome da turma.';
    } else if (nome.trim().length > 100) {
      errors.nome = 'O nome deve ter no máximo 100 caracteres.';
    }

    if (!anoLetivo || !Number.isInteger(parsedAno)) {
      errors.anoLetivo = 'Informe um ano letivo válido.';
    } else if (parsedAno < MIN_ANO_LETIVO || parsedAno > MAX_ANO_LETIVO) {
      errors.anoLetivo = `O ano letivo deve estar entre ${MIN_ANO_LETIVO} e ${MAX_ANO_LETIVO}.`;
    }

    if (!turno) {
      errors.turno = 'Selecione o turno da turma.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setApiError(null);

    if (!validate() || !turno) {
      return;
    }

    setIsSubmitting(true);
    try {
      const baseDto = { nome, anoLetivo: Number(anoLetivo), turno };

      if (isEditMode) {
        const response = await turmaService.update(turmaToEdit.id, { ...baseDto, ativo });
        onSuccess(response.mensagem || 'Turma atualizada com sucesso!');
      } else {
        const response = await turmaService.create(baseDto);
        onSuccess(response.mensagem || 'Turma criada com sucesso!');
      }
      onClose();
    } catch (error: unknown) {
      setApiError(
        extractErrorMessage(
          error,
          isEditMode ? 'Erro ao atualizar a turma.' : 'Erro ao cadastrar a turma.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = (hasError: boolean) =>
    `mt-1 block w-full rounded-xl border px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:outline-hidden ${
      hasError
        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
        : 'border-slate-300 focus:border-[#0d2949] focus:ring-[#0d2949]/20'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="turma-modal-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#0d2949]">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h3 id="turma-modal-title" className="text-base font-bold text-slate-900">
                {isEditMode ? 'Editar Turma' : 'Nova Turma'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? `Atualizando dados da turma #${turmaToEdit.id}`
                  : 'Cadastre uma turma para organizar os leitores'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-6">
          {apiError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label htmlFor="turma-nome" className="block text-xs font-semibold text-slate-700">
              Nome da Turma *
            </label>
            <input
              id="turma-nome"
              type="text"
              value={nome}
              maxLength={100}
              onChange={(e) => {
                setNome(e.target.value);
                setFieldErrors((prev) => ({ ...prev, nome: undefined }));
              }}
              placeholder='Ex.: "3º Ano B"'
              className={inputClassName(Boolean(fieldErrors.nome))}
            />
            {fieldErrors.nome && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.nome}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="turma-ano" className="block text-xs font-semibold text-slate-700">
                Ano Letivo *
              </label>
              <input
                id="turma-ano"
                type="number"
                inputMode="numeric"
                min={MIN_ANO_LETIVO}
                max={MAX_ANO_LETIVO}
                step={1}
                value={anoLetivo}
                onChange={(e) => {
                  setAnoLetivo(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, anoLetivo: undefined }));
                }}
                className={inputClassName(Boolean(fieldErrors.anoLetivo))}
              />
              {fieldErrors.anoLetivo && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.anoLetivo}</p>
              )}
            </div>

            <div>
              <label htmlFor="turma-turno" className="block text-xs font-semibold text-slate-700">
                Turno *
              </label>
              <select
                id="turma-turno"
                value={turno}
                onChange={(e) => {
                  setTurno(e.target.value as Turno | '');
                  setFieldErrors((prev) => ({ ...prev, turno: undefined }));
                }}
                className={`${inputClassName(Boolean(fieldErrors.turno))} bg-white`}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {TURNOS.map((turnoOption) => (
                  <option key={turnoOption} value={turnoOption}>
                    {turnoOption}
                  </option>
                ))}
              </select>
              {fieldErrors.turno && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.turno}</p>
              )}
            </div>
          </div>

          {isEditMode && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#0d2949]"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">Turma ativa</span>
                <span className="block text-xs text-slate-500">
                  Turmas inativas não aparecem para novos vínculos de disciplinas.
                </span>
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0d2949] px-4 py-2 text-sm font-semibold text-white shadow-2xs transition hover:bg-[#163d6b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Salvar Alterações' : 'Cadastrar Turma'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TurmaModal({ isOpen, turmaToEdit, onClose, onSuccess }: TurmaModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <TurmaFormContent
      key={turmaToEdit ? `edit-${turmaToEdit.id}` : 'create'}
      turmaToEdit={turmaToEdit}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

