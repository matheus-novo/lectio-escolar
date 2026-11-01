import {
  CalendarDays,
  CheckSquare,
  Clock,
  Loader2,
  Search,
  Square,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { extractErrorMessage } from '../../services/api';
import { turmaService } from '../../services/turmaService';
import { usuarioService } from '../../services/usuarioService';
import type { AlunoResumoDto, Turma, TurmaDetalhada, Usuario } from '../../types';
import { FeedbackAlert } from '../ui/FeedbackAlert';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmActionModal } from './ConfirmActionModal';

interface EnturmacaoModalProps {
  turma: Turma | null;
  onClose: () => void;
  /** Disparado após qualquer alteração de vínculos para que a listagem atualize o total de alunos. */
  onEnrollmentChanged: () => void;
}

interface FeedbackState {
  variant: 'success' | 'error';
  message: string;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
}

interface EnturmacaoContentProps {
  turma: Turma;
  onClose: () => void;
  onEnrollmentChanged: () => void;
}

function EnturmacaoContent({ turma, onClose, onEnrollmentChanged }: EnturmacaoContentProps) {
  const [turmaDetalhada, setTurmaDetalhada] = useState<TurmaDetalhada | null>(null);
  const [alunosAtivos, setAlunosAtivos] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const [enrolledSearch, setEnrolledSearch] = useState<string>('');
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [selectedAlunoIds, setSelectedAlunoIds] = useState<Set<number>>(new Set());
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);

  const [alunoToUnenroll, setAlunoToUnenroll] = useState<AlunoResumoDto | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [detalhes, usuarios] = await Promise.all([
          turmaService.getById(turma.id),
          usuarioService.getAll(),
        ]);
        if (!isMounted) return;
        setTurmaDetalhada(detalhes);
        setAlunosAtivos(usuarios.filter((u) => u.perfil === 'Aluno' && u.ativo));
      } catch (error: unknown) {
        if (!isMounted) return;
        setLoadError(
          extractErrorMessage(error, 'Não foi possível carregar os dados da turma.')
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [turma.id]);

  const refreshTurmaDetalhada = async () => {
    const detalhes = await turmaService.getById(turma.id);
    setTurmaDetalhada(detalhes);
  };

  const enrolledIds = useMemo(
    () => new Set(turmaDetalhada?.alunos.map((aluno) => aluno.id) ?? []),
    [turmaDetalhada]
  );

  const filteredEnrolled = useMemo(() => {
    const term = enrolledSearch.trim().toLowerCase();
    const alunos = [...(turmaDetalhada?.alunos ?? [])].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    );
    if (!term) return alunos;
    return alunos.filter(
      (aluno) =>
        aluno.nome.toLowerCase().includes(term) ||
        aluno.email.toLowerCase().includes(term) ||
        aluno.matricula.toLowerCase().includes(term)
    );
  }, [turmaDetalhada, enrolledSearch]);

  const eligibleCandidates = useMemo(
    () =>
      alunosAtivos
        .filter((aluno) => !enrolledIds.has(aluno.id))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [alunosAtivos, enrolledIds]
  );

  const filteredCandidates = useMemo(() => {
    const term = candidateSearch.trim().toLowerCase();
    if (!term) return eligibleCandidates;
    return eligibleCandidates.filter(
      (aluno) =>
        aluno.nome.toLowerCase().includes(term) ||
        aluno.email.toLowerCase().includes(term) ||
        (aluno.matricula ?? '').toLowerCase().includes(term)
    );
  }, [eligibleCandidates, candidateSearch]);

  const areAllFilteredSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((aluno) => selectedAlunoIds.has(aluno.id));

  const toggleCandidate = (alunoId: number) => {
    setSelectedAlunoIds((prev) => {
      const next = new Set(prev);
      if (next.has(alunoId)) {
        next.delete(alunoId);
      } else {
        next.add(alunoId);
      }
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedAlunoIds((prev) => {
      const next = new Set(prev);
      filteredCandidates.forEach((aluno) => {
        if (areAllFilteredSelected) {
          next.delete(aluno.id);
        } else {
          next.add(aluno.id);
        }
      });
      return next;
    });
  };

  const handleEnroll = async () => {
    if (selectedAlunoIds.size === 0 || isEnrolling) return;

    setIsEnrolling(true);
    setFeedback(null);
    try {
      const response = await turmaService.enrollAlunos(turma.id, {
        alunosIds: Array.from(selectedAlunoIds),
      });
      setSelectedAlunoIds(new Set());
      setCandidateSearch('');
      await refreshTurmaDetalhada();
      onEnrollmentChanged();
      setFeedback({
        variant: 'success',
        message: response.mensagem || 'Discentes enturmados com sucesso!',
      });
    } catch (error: unknown) {
      setFeedback({
        variant: 'error',
        message: extractErrorMessage(error, 'Não foi possível enturmar os alunos.'),
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleConfirmUnenroll = async () => {
    if (!alunoToUnenroll || isUnenrolling) return;

    setIsUnenrolling(true);
    setFeedback(null);
    try {
      const response = await turmaService.unenrollAluno(turma.id, alunoToUnenroll.id);
      await refreshTurmaDetalhada();
      onEnrollmentChanged();
      setFeedback({
        variant: 'success',
        message: response.mensagem || 'Aluno desvinculado da turma.',
      });
    } catch (error: unknown) {
      setFeedback({
        variant: 'error',
        message: extractErrorMessage(error, 'Não foi possível desvincular o aluno.'),
      });
    } finally {
      setIsUnenrolling(false);
      setAlunoToUnenroll(null);
    }
  };

  const isBusy = isEnrolling || isUnenrolling;
  const headerData = turmaDetalhada ?? turma;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enturmacao-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-linear-to-r from-[#0d2949] to-[#123a63] px-6 py-5 text-white">
          <div>
            <p className="text-xs font-semibold tracking-wider text-emerald-200 uppercase">
              Alunos e Enturmação
            </p>
            <h3 id="enturmacao-modal-title" className="mt-1 text-xl font-bold">
              {headerData.nome}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Ano letivo {headerData.anoLetivo}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {headerData.turno}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {turmaDetalhada ? turmaDetalhada.alunos.length : turma.totalAlunos} aluno(s)
              </span>
              <StatusBadge active={headerData.ativo} activeLabel="Ativa" inactiveLabel="Inativa" />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg p-1.5 text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {feedback && (
            <div className="mb-5">
              <FeedbackAlert
                variant={feedback.variant}
                message={feedback.message}
                onDismiss={() => setFeedback(null)}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#0d2949]" />
              <p className="mt-3 text-sm text-slate-600">Carregando alunos da turma...</p>
            </div>
          ) : loadError ? (
            <FeedbackAlert variant="error" message={loadError} onDismiss={onClose} />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Alunos vinculados */}
              <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Alunos vinculados ({turmaDetalhada?.alunos.length ?? 0})
                  </h4>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={enrolledSearch}
                      onChange={(e) => setEnrolledSearch(e.target.value)}
                      placeholder="Filtrar vinculados..."
                      aria-label="Filtrar alunos vinculados"
                      className="block w-full rounded-lg border border-slate-300 py-1.5 pr-3 pl-9 text-sm focus:border-[#0d2949] focus:ring-2 focus:ring-[#0d2949]/20 focus:outline-hidden"
                    />
                  </div>
                </div>

                <ul className="max-h-96 flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {filteredEnrolled.length === 0 ? (
                    <li className="flex flex-col items-center px-4 py-12 text-center">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {turmaDetalhada?.alunos.length
                          ? 'Nenhum aluno corresponde ao filtro.'
                          : 'Nenhum aluno vinculado a esta turma.'}
                      </p>
                      {!turmaDetalhada?.alunos.length && (
                        <p className="mt-1 text-xs text-slate-500">
                          Selecione alunos ao lado para iniciar a enturmação.
                        </p>
                      )}
                    </li>
                  ) : (
                    filteredEnrolled.map((aluno) => (
                      <li key={aluno.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{aluno.nome}</p>
                          <p className="truncate text-xs text-slate-500">
                            Matrícula {aluno.matricula || '—'} · desde {formatDate(aluno.dataMatricula)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAlunoToUnenroll(aluno)}
                          disabled={isBusy}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Desvincular aluno da turma"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          <span>Desvincular</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              {/* Alocar novos alunos */}
              <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      Alocar novos alunos ({eligibleCandidates.length} disponíveis)
                    </h4>
                    {filteredCandidates.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAllFiltered}
                        disabled={isBusy}
                        className="text-xs font-semibold text-[#175a3a] hover:underline disabled:opacity-50"
                      >
                        {areAllFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                      </button>
                    )}
                  </div>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Buscar por nome, e-mail ou matrícula..."
                      aria-label="Buscar alunos disponíveis"
                      className="block w-full rounded-lg border border-slate-300 py-1.5 pr-3 pl-9 text-sm focus:border-[#0d2949] focus:ring-2 focus:ring-[#0d2949]/20 focus:outline-hidden"
                    />
                  </div>
                </div>

                <ul className="max-h-96 flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {filteredCandidates.length === 0 ? (
                    <li className="flex flex-col items-center px-4 py-12 text-center">
                      <UserPlus className="h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {eligibleCandidates.length === 0
                          ? 'Todos os alunos ativos já estão nesta turma.'
                          : 'Nenhum aluno encontrado para a busca.'}
                      </p>
                    </li>
                  ) : (
                    filteredCandidates.map((aluno) => {
                      const isSelected = selectedAlunoIds.has(aluno.id);
                      return (
                        <li key={aluno.id}>
                          <label
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                              isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isBusy}
                              onChange={() => toggleCandidate(aluno.id)}
                              className="sr-only"
                            />
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 shrink-0 text-[#175a3a]" />
                            ) : (
                              <Square className="h-5 w-5 shrink-0 text-slate-300" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{aluno.nome}</p>
                              <p className="truncate text-xs text-slate-500">
                                {aluno.email}
                                {aluno.matricula ? ` · Matrícula ${aluno.matricula}` : ''}
                              </p>
                            </div>
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                  <span className="text-xs text-slate-600">
                    <strong>{selectedAlunoIds.size}</strong> selecionado(s)
                  </span>
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={selectedAlunoIds.size === 0 || isBusy}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#175a3a] px-4 py-2 text-sm font-semibold text-white shadow-2xs transition hover:bg-[#1e6e48] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isEnrolling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enturmando...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Confirmar enturmação</span>
                      </>
                    )}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <ConfirmActionModal
        isOpen={alunoToUnenroll !== null}
        title="Desvincular aluno"
        description={
          <p>
            Deseja desvincular <strong className="text-slate-900">{alunoToUnenroll?.nome}</strong> da
            turma <strong className="text-slate-900">{headerData.nome}</strong>?
          </p>
        }
        warning="O aluno deixará de ter acesso aos materiais compartilhados com esta turma. Ele poderá ser enturmado novamente depois."
        confirmLabel="Desvincular"
        submittingLabel="Desvinculando..."
        isSubmitting={isUnenrolling}
        onCancel={() => setAlunoToUnenroll(null)}
        onConfirm={handleConfirmUnenroll}
      />
    </div>
  );
}

export function EnturmacaoModal({ turma, onClose, onEnrollmentChanged }: EnturmacaoModalProps) {
  if (!turma) {
    return null;
  }

  return (
    <EnturmacaoContent
      key={turma.id}
      turma={turma}
      onClose={onClose}
      onEnrollmentChanged={onEnrollmentChanged}
    />
  );
}

