import { AlertCircle, BookMarked, Loader2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { extractErrorMessage } from '../../services/api';
import { disciplinaService } from '../../services/disciplinaService';
import type { Disciplina, Turma, Usuario } from '../../types';

interface DisciplinaModalProps {
  isOpen: boolean;
  disciplinaToEdit: Disciplina | null;
  /** Lista completa de turmas (o modal exibe apenas as ativas, além da vinculada atualmente). */
  turmas: Turma[];
  /** Lista de usuários com perfil Professor. */
  professores: Usuario[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface DisciplinaFormErrors {
  nome?: string;
  descricao?: string;
  turmaId?: string;
  professorId?: string;
}

const MAX_DESCRICAO_LENGTH = 500;

type DisciplinaFormContentProps = Omit<DisciplinaModalProps, 'isOpen'>;

function DisciplinaFormContent({
  disciplinaToEdit,
  turmas,
  professores,
  onClose,
  onSuccess,
}: DisciplinaFormContentProps) {
  const isEditMode = disciplinaToEdit !== null;

  const [nome, setNome] = useState<string>(disciplinaToEdit?.nome ?? '');
  const [descricao, setDescricao] = useState<string>(disciplinaToEdit?.descricao ?? '');
  const [turmaId, setTurmaId] = useState<string>(
    disciplinaToEdit ? String(disciplinaToEdit.turmaId) : ''
  );
  const [professorId, setProfessorId] = useState<string>(
    disciplinaToEdit ? String(disciplinaToEdit.professorId) : ''
  );
  const [ativo, setAtivo] = useState<boolean>(disciplinaToEdit?.ativo ?? true);

  const [fieldErrors, setFieldErrors] = useState<DisciplinaFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const turmaOptions = useMemo(
    () =>
      turmas
        .filter((turma) => turma.ativo || turma.id === disciplinaToEdit?.turmaId)
        .sort((a, b) => b.anoLetivo - a.anoLetivo || a.nome.localeCompare(b.nome, 'pt-BR')),
    [turmas, disciplinaToEdit?.turmaId]
  );

  const professorOptions = useMemo(
    () =>
      professores
        .filter((professor) => professor.ativo || professor.id === disciplinaToEdit?.professorId)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [professores, disciplinaToEdit?.professorId]
  );

  const validate = (): boolean => {
    const errors: DisciplinaFormErrors = {};
    const selectedTurma = turmas.find((turma) => turma.id === Number(turmaId));
    const selectedProfessor = professores.find((prof) => prof.id === Number(professorId));

    if (!nome.trim()) {
      errors.nome = 'Informe o nome da disciplina.';
    } else if (nome.trim().length > 100) {
      errors.nome = 'O nome deve ter no máximo 100 caracteres.';
    }

    if (descricao.length > MAX_DESCRICAO_LENGTH) {
      errors.descricao = `A descrição deve ter no máximo ${MAX_DESCRICAO_LENGTH} caracteres.`;
    }

    if (!selectedTurma) {
      errors.turmaId = 'Selecione a turma vinculada.';
    } else if (!selectedTurma.ativo) {
      errors.turmaId = 'A turma selecionada está inativa. Escolha uma turma ativa.';
    }

    if (!selectedProfessor) {
      errors.professorId = 'Selecione o professor responsável.';
    } else if (!selectedProfessor.ativo) {
      errors.professorId = 'O professor selecionado está inativo. Escolha um professor ativo.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const baseDto = {
        nome,
        descricao,
        turmaId: Number(turmaId),
        professorId: Number(professorId),
      };

      if (isEditMode) {
        const response = await disciplinaService.update(disciplinaToEdit.id, { ...baseDto, ativo });
        onSuccess(response.mensagem || 'Disciplina atualizada com sucesso!');
      } else {
        const response = await disciplinaService.create(baseDto);
        onSuccess(response.mensagem || 'Disciplina criada com sucesso!');
      }
      onClose();
    } catch (error: unknown) {
      setApiError(
        extractErrorMessage(
          error,
          isEditMode ? 'Erro ao atualizar a disciplina.' : 'Erro ao cadastrar a disciplina.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClassName = (hasError: boolean) =>
    `mt-1 block w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:outline-hidden ${
      hasError
        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
        : 'border-slate-300 focus:border-[#0d2949] focus:ring-[#0d2949]/20'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disciplina-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#175a3a]">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <h3 id="disciplina-modal-title" className="text-base font-bold text-slate-900">
                {isEditMode ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? `Atualizando disciplina #${disciplinaToEdit.id}`
                  : 'Vincule a disciplina a uma turma e a um professor'}
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4 overflow-y-auto p-6">
          {apiError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label htmlFor="disciplina-nome" className="block text-xs font-semibold text-slate-700">
              Nome da Disciplina *
            </label>
            <input
              id="disciplina-nome"
              type="text"
              value={nome}
              maxLength={100}
              onChange={(e) => {
                setNome(e.target.value);
                setFieldErrors((prev) => ({ ...prev, nome: undefined }));
              }}
              placeholder='Ex.: "História Geral"'
              className={fieldClassName(Boolean(fieldErrors.nome))}
            />
            {fieldErrors.nome && <p className="mt-1 text-xs text-rose-600">{fieldErrors.nome}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="disciplina-descricao" className="block text-xs font-semibold text-slate-700">
                Descrição <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <span
                className={`text-[11px] ${
                  descricao.length > MAX_DESCRICAO_LENGTH ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {descricao.length}/{MAX_DESCRICAO_LENGTH}
              </span>
            </div>
            <textarea
              id="disciplina-descricao"
              rows={3}
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                setFieldErrors((prev) => ({ ...prev, descricao: undefined }));
              }}
              placeholder="Breve descrição do conteúdo e dos materiais da disciplina..."
              className={`${fieldClassName(Boolean(fieldErrors.descricao))} resize-y`}
            />
            {fieldErrors.descricao && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.descricao}</p>
            )}
          </div>

          <div>
            <label htmlFor="disciplina-turma" className="block text-xs font-semibold text-slate-700">
              Turma *
            </label>
            <select
              id="disciplina-turma"
              value={turmaId}
              onChange={(e) => {
                setTurmaId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, turmaId: undefined }));
              }}
              className={fieldClassName(Boolean(fieldErrors.turmaId))}
            >
              <option value="" disabled>
                {turmaOptions.length === 0 ? 'Nenhuma turma ativa cadastrada' : 'Selecione a turma...'}
              </option>
              {turmaOptions.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome} — {turma.anoLetivo} ({turma.turno})
                  {turma.ativo ? '' : ' [inativa]'}
                </option>
              ))}
            </select>
            {fieldErrors.turmaId && <p className="mt-1 text-xs text-rose-600">{fieldErrors.turmaId}</p>}
          </div>

          <div>
            <label htmlFor="disciplina-professor" className="block text-xs font-semibold text-slate-700">
              Professor Responsável *
            </label>
            <select
              id="disciplina-professor"
              value={professorId}
              onChange={(e) => {
                setProfessorId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, professorId: undefined }));
              }}
              className={fieldClassName(Boolean(fieldErrors.professorId))}
            >
              <option value="" disabled>
                {professorOptions.length === 0
                  ? 'Nenhum professor ativo cadastrado'
                  : 'Selecione o professor...'}
              </option>
              {professorOptions.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                  {professor.registroFuncional ? ` — RF ${professor.registroFuncional}` : ''}
                  {professor.ativo ? '' : ' [inativo]'}
                </option>
              ))}
            </select>
            {fieldErrors.professorId && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.professorId}</p>
            )}
          </div>

          {isEditMode && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div>
                <span className="block text-sm font-semibold text-slate-800">Disciplina ativa</span>
                <span className="block text-xs text-slate-500">
                  Disciplinas inativas não recebem novos materiais.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={ativo}
                aria-label="Alternar status da disciplina"
                onClick={() => setAtivo((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  ativo ? 'bg-[#175a3a]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    ativo ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
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
                <span>{isEditMode ? 'Salvar Alterações' : 'Cadastrar Disciplina'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DisciplinaModal({ isOpen, disciplinaToEdit, ...rest }: DisciplinaModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <DisciplinaFormContent
      key={disciplinaToEdit ? `edit-${disciplinaToEdit.id}` : 'create'}
      disciplinaToEdit={disciplinaToEdit}
      {...rest}
    />
  );
}

