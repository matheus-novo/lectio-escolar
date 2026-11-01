import {
  BookMarked,
  Edit3,
  Filter,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmActionModal } from '../../components/modals/ConfirmActionModal';
import { DisciplinaModal } from '../../components/modals/DisciplinaModal';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/TableSkeleton';
import { extractErrorMessage } from '../../services/api';
import { disciplinaService } from '../../services/disciplinaService';
import { turmaService } from '../../services/turmaService';
import { usuarioService } from '../../services/usuarioService';
import type { Disciplina, DisciplinaListFilters, Turma, Usuario } from '../../types';

type StatusFilter = 'ativas' | 'inativas' | 'todas';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ativas', label: 'Ativas' },
  { value: 'inativas', label: 'Inativas' },
  { value: 'todas', label: 'Todas' },
];

const DESCRICAO_PREVIEW_LENGTH = 70;

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export function Disciplinas() {
  // Lookups (turmas e professores) usados nos filtros e no modal
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [turmaFilter, setTurmaFilter] = useState<string>('');
  const [professorFilter, setProfessorFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativas');

  const [isDisciplinaModalOpen, setIsDisciplinaModalOpen] = useState<boolean>(false);
  const [disciplinaToEdit, setDisciplinaToEdit] = useState<Disciplina | null>(null);
  const [disciplinaToDeactivate, setDisciplinaToDeactivate] = useState<Disciplina | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLookups() {
      try {
        const [turmasData, usuariosData] = await Promise.all([
          turmaService.listAll(),
          usuarioService.getAll(),
        ]);
        if (!isMounted) return;
        setTurmas(turmasData);
        setProfessores(usuariosData.filter((usuario) => usuario.perfil === 'Professor'));
      } catch (error: unknown) {
        if (!isMounted) return;
        setLookupError(
          extractErrorMessage(error, 'Não foi possível carregar turmas e professores.')
        );
      }
    }

    void loadLookups();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let isMounted = true;

    const filters: DisciplinaListFilters = {
      turmaId: turmaFilter ? Number(turmaFilter) : undefined,
      professorId: professorFilter ? Number(professorFilter) : undefined,
      ativo: statusFilter === 'todas' ? undefined : statusFilter === 'ativas',
    };

    async function loadDisciplinas() {
      try {
        const data = await disciplinaService.listAll(filters);
        if (!isMounted) return;
        setDisciplinas(data);
        setErrorMessage(null);
      } catch (error: unknown) {
        if (!isMounted) return;
        setErrorMessage(extractErrorMessage(error, 'Não foi possível carregar as disciplinas.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadDisciplinas();
    return () => {
      isMounted = false;
    };
  }, [turmaFilter, professorFilter, statusFilter, reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const changeFilter = (applyChange: () => void) => {
    setIsLoading(true);
    applyChange();
  };

  const sortedTurmas = useMemo(
    () =>
      [...turmas].sort(
        (a, b) => b.anoLetivo - a.anoLetivo || a.nome.localeCompare(b.nome, 'pt-BR')
      ),
    [turmas]
  );

  const sortedProfessores = useMemo(
    () => [...professores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [professores]
  );

  const sortedDisciplinas = useMemo(
    () =>
      [...disciplinas].sort(
        (a, b) =>
          a.nomeTurma.localeCompare(b.nomeTurma, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR')
      ),
    [disciplinas]
  );

  const hasActiveFilters = turmaFilter !== '' || professorFilter !== '' || statusFilter !== 'todas';

  const clearFilters = () => {
    changeFilter(() => {
      setTurmaFilter('');
      setProfessorFilter('');
      setStatusFilter('todas');
    });
  };

  const openCreateModal = () => {
    setDisciplinaToEdit(null);
    setIsDisciplinaModalOpen(true);
  };

  const openEditModal = (disciplina: Disciplina) => {
    setDisciplinaToEdit(disciplina);
    setIsDisciplinaModalOpen(true);
  };

  const handleDisciplinaSaved = (message: string) => {
    setSuccessMessage(message);
    reload();
  };

  const handleConfirmDeactivate = async () => {
    if (!disciplinaToDeactivate || isDeactivating) return;

    setIsDeactivating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await disciplinaService.deactivate(disciplinaToDeactivate.id);
      setSuccessMessage(response.mensagem || 'Disciplina desativada com sucesso!');
      reload();
    } catch (error: unknown) {
      setErrorMessage(extractErrorMessage(error, 'Falha ao desativar a disciplina.'));
    } finally {
      setIsDeactivating(false);
      setDisciplinaToDeactivate(null);
    }
  };

  const selectClassName =
    'block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0d2949] focus:ring-2 focus:ring-[#0d2949]/20 focus:outline-hidden';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Disciplinas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Vincule disciplinas às turmas e aos professores responsáveis pelos materiais compartilhados.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reload}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={lookupError !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d2949] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163d6b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Disciplina</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <FeedbackAlert variant="success" message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      )}
      {errorMessage && (
        <FeedbackAlert variant="error" message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}
      {lookupError && (
        <FeedbackAlert variant="error" message={lookupError} onDismiss={() => setLookupError(null)} />
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <label htmlFor="filter-turma" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              Turma
            </label>
            <select
              id="filter-turma"
              value={turmaFilter}
              onChange={(e) => changeFilter(() => setTurmaFilter(e.target.value))}
              className={selectClassName}
            >
              <option value="">Todas as turmas</option>
              {sortedTurmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome} — {turma.anoLetivo}
                  {turma.ativo ? '' : ' [inativa]'}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="filter-professor" className="mb-1 block text-xs font-semibold text-slate-600">
              Professor
            </label>
            <select
              id="filter-professor"
              value={professorFilter}
              onChange={(e) => changeFilter(() => setProfessorFilter(e.target.value))}
              className={selectClassName}
            >
              <option value="">Todos os professores</option>
              {sortedProfessores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                  {professor.ativo ? '' : ' [inativo]'}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Status</span>
            <div
              className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-100 p-1"
              role="radiogroup"
              aria-label="Filtrar por status"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={statusFilter === option.value}
                  onClick={() => {
                    if (option.value !== statusFilter) {
                      changeFilter(() => setStatusFilter(option.value));
                    }
                  }}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === option.value
                      ? 'bg-white text-[#0d2949] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : sortedDisciplinas.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <BookMarked className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">Nenhuma disciplina encontrada</h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              {hasActiveFilters
                ? 'Nenhuma disciplina corresponde aos filtros selecionados.'
                : 'Cadastre a primeira disciplina vinculando-a a uma turma e a um professor.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Disciplina</th>
                  <th scope="col" className="px-6 py-3.5">Turma</th>
                  <th scope="col" className="px-6 py-3.5">Professor Responsável</th>
                  <th scope="col" className="px-6 py-3.5">Descrição</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedDisciplinas.map((disciplina) => (
                  <tr key={disciplina.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-semibold whitespace-nowrap text-slate-900">
                      {disciplina.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-[#0d2949]">
                        {disciplina.nomeTurma}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">{disciplina.nomeProfessor}</td>
                    <td className="max-w-xs px-6 py-4 text-slate-500" title={disciplina.descricao ?? undefined}>
                      {disciplina.descricao ? (
                        truncateText(disciplina.descricao, DESCRICAO_PREVIEW_LENGTH)
                      ) : (
                        <span className="text-slate-400 italic">Sem descrição</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge active={disciplina.ativo} activeLabel="Ativa" inactiveLabel="Inativa" />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(disciplina)}
                          disabled={lookupError !== null}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-[#0d2949] disabled:cursor-not-allowed disabled:opacity-50"
                          title="Editar disciplina"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        {disciplina.ativo && (
                          <button
                            type="button"
                            onClick={() => setDisciplinaToDeactivate(disciplina)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                            title="Desativar disciplina"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Desativar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && sortedDisciplinas.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500">
            <strong>{sortedDisciplinas.length}</strong> disciplina(s) encontrada(s).
          </div>
        )}
      </div>

      <DisciplinaModal
        isOpen={isDisciplinaModalOpen}
        disciplinaToEdit={disciplinaToEdit}
        turmas={turmas}
        professores={professores}
        onClose={() => setIsDisciplinaModalOpen(false)}
        onSuccess={handleDisciplinaSaved}
      />

      <ConfirmActionModal
        isOpen={disciplinaToDeactivate !== null}
        title="Desativar disciplina"
        description={
          <p>
            Tem certeza de que deseja desativar a disciplina{' '}
            <strong className="text-slate-900">{disciplinaToDeactivate?.nome}</strong> da turma{' '}
            <strong className="text-slate-900">{disciplinaToDeactivate?.nomeTurma}</strong>?
          </p>
        }
        warning="A disciplina deixará de receber novos materiais, mas o acervo já compartilhado será preservado. Ela pode ser reativada pela edição."
        confirmLabel="Confirmar desativação"
        submittingLabel="Desativando..."
        isSubmitting={isDeactivating}
        onCancel={() => setDisciplinaToDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}

