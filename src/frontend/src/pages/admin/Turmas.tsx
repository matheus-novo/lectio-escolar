import {
  Edit3,
  Plus,
  RefreshCw,
  School,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmActionModal } from '../../components/modals/ConfirmActionModal';
import { EnturmacaoModal } from '../../components/modals/EnturmacaoModal';
import { TurmaModal } from '../../components/modals/TurmaModal';
import { FeedbackAlert } from '../../components/ui/FeedbackAlert';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/TableSkeleton';
import { extractErrorMessage } from '../../services/api';
import { turmaService } from '../../services/turmaService';
import type { Turma } from '../../types';

type StatusFilter = 'todas' | 'ativas' | 'inativas';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'ativas', label: 'Apenas Ativas' },
  { value: 'inativas', label: 'Inativas' },
];

function statusFilterToAtivo(filter: StatusFilter): boolean | undefined {
  if (filter === 'ativas') return true;
  if (filter === 'inativas') return false;
  return undefined;
}

export function Turmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState<boolean>(false);
  const [turmaToEdit, setTurmaToEdit] = useState<Turma | null>(null);
  const [turmaToManage, setTurmaToManage] = useState<Turma | null>(null);
  const [turmaToDeactivate, setTurmaToDeactivate] = useState<Turma | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTurmas() {
      try {
        const data = await turmaService.listAll({ ativo: statusFilterToAtivo(statusFilter) });
        if (!isMounted) return;
        setTurmas(data);
        setErrorMessage(null);
      } catch (error: unknown) {
        if (!isMounted) return;
        setErrorMessage(extractErrorMessage(error, 'Não foi possível carregar as turmas.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadTurmas();
    return () => {
      isMounted = false;
    };
  }, [statusFilter, reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  /** Atualiza silenciosamente (sem skeleton), usado após alterações de enturmação. */
  const silentReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  const handleStatusFilterChange = (filter: StatusFilter) => {
    if (filter === statusFilter) return;
    setIsLoading(true);
    setStatusFilter(filter);
  };

  const filteredTurmas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return [...turmas]
      .filter((turma) => !term || turma.nome.toLowerCase().includes(term))
      .sort((a, b) => b.anoLetivo - a.anoLetivo || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [turmas, searchTerm]);

  const openCreateModal = () => {
    setTurmaToEdit(null);
    setIsTurmaModalOpen(true);
  };

  const openEditModal = (turma: Turma) => {
    setTurmaToEdit(turma);
    setIsTurmaModalOpen(true);
  };

  const handleTurmaSaved = (message: string) => {
    setSuccessMessage(message);
    reload();
  };

  const handleConfirmDeactivate = async () => {
    if (!turmaToDeactivate || isDeactivating) return;

    setIsDeactivating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await turmaService.deactivate(turmaToDeactivate.id);
      setSuccessMessage(response.mensagem || 'Turma desativada com sucesso!');
      reload();
    } catch (error: unknown) {
      setErrorMessage(extractErrorMessage(error, 'Falha ao desativar a turma.'));
    } finally {
      setIsDeactivating(false);
      setTurmaToDeactivate(null);
    }
  };

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'todas';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Turmas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Organize os alunos leitores em turmas para direcionar o compartilhamento de materiais.
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
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d2949] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163d6b]"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Turma</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <FeedbackAlert variant="success" message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      )}
      {errorMessage && (
        <FeedbackAlert variant="error" message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-96">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar turma pelo nome..."
            aria-label="Buscar turma pelo nome"
            className="block w-full rounded-xl border border-slate-300 py-2 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0d2949] focus:ring-2 focus:ring-[#0d2949]/20 focus:outline-hidden"
          />
        </div>

        <div
          className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1"
          role="radiogroup"
          aria-label="Filtrar por status"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={statusFilter === option.value}
              onClick={() => handleStatusFilterChange(option.value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : filteredTurmas.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <School className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">Nenhuma turma encontrada</h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              {hasActiveFilters
                ? 'Nenhuma turma corresponde aos filtros aplicados.'
                : 'Cadastre a primeira turma para começar a organizar os alunos.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  handleStatusFilterChange('todas');
                }}
                className="mt-4 rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0d2949] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#163d6b]"
              >
                <Plus className="h-3.5 w-3.5" />
                Cadastrar turma
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Nome</th>
                  <th scope="col" className="px-6 py-3.5">Ano Letivo</th>
                  <th scope="col" className="px-6 py-3.5">Turno</th>
                  <th scope="col" className="px-6 py-3.5">Alunos</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTurmas.map((turma) => (
                  <tr key={turma.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-semibold whitespace-nowrap text-slate-900">
                      {turma.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{turma.anoLetivo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {turma.turno}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Users className="h-4 w-4 text-slate-400" />
                        {turma.totalAlunos}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge active={turma.ativo} activeLabel="Ativa" inactiveLabel="Inativa" />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTurmaToManage(turma)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-medium text-[#175a3a] transition hover:bg-emerald-100"
                          title="Ver alunos e enturmar"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Alunos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(turma)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-[#0d2949]"
                          title="Editar turma"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        {turma.ativo && (
                          <button
                            type="button"
                            onClick={() => setTurmaToDeactivate(turma)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                            title="Desativar turma"
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

        {!isLoading && filteredTurmas.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500">
            Exibindo <strong>{filteredTurmas.length}</strong> de <strong>{turmas.length}</strong> turma(s).
          </div>
        )}
      </div>

      <TurmaModal
        isOpen={isTurmaModalOpen}
        turmaToEdit={turmaToEdit}
        onClose={() => setIsTurmaModalOpen(false)}
        onSuccess={handleTurmaSaved}
      />

      <EnturmacaoModal
        turma={turmaToManage}
        onClose={() => setTurmaToManage(null)}
        onEnrollmentChanged={silentReload}
      />

      <ConfirmActionModal
        isOpen={turmaToDeactivate !== null}
        title="Desativar turma"
        description={
          <p>
            Tem certeza de que deseja desativar a turma{' '}
            <strong className="text-slate-900">{turmaToDeactivate?.nome}</strong> (
            {turmaToDeactivate?.anoLetivo})?
          </p>
        }
        warning="A turma deixará de ser listada para novos vínculos de disciplinas. Os alunos e o histórico serão preservados, e ela pode ser reativada pela edição."
        confirmLabel="Confirmar desativação"
        submittingLabel="Desativando..."
        isSubmitting={isDeactivating}
        onCancel={() => setTurmaToDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}

