import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDeactivateModal } from '../../components/modals/ConfirmDeactivateModal';
import { UsuarioModal } from '../../components/modals/UsuarioModal';
import { useAuth } from '../../contexts/AuthContext';
import { extractErrorMessage } from '../../services/api';
import { usuarioService } from '../../services/usuarioService';
import type { PerfilUsuario, Usuario } from '../../types';

type ProfileFilter = 'Todos' | PerfilUsuario;
type StatusFilter = 'Todos' | 'Ativos' | 'Inativos';

function getProfileBadgeClasses(perfil: PerfilUsuario): string {
  switch (perfil) {
    case 'Administrador':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Professor':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Aluno':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
}

export function Usuarios() {
  const { user: currentUser, role, updateProfileState } = useAuth();
  const isAdmin = role === 'Administrador';
  const currentUserId = currentUser?.id;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<ProfileFilter>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('Todos');

  // Modals state
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState<boolean>(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);
  const [usuarioToDeactivate, setUsuarioToDeactivate] = useState<Usuario | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUsuarios() {
      try {
        const data = await usuarioService.getAll();
        if (!isMounted) return;

        setUsuarios(data);
        setErrorMessage(null);

        if (currentUserId) {
          const updatedSelf = data.find((u) => u.id === currentUserId);
          if (updatedSelf) {
            updateProfileState(updatedSelf);
          }
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        setErrorMessage(
          extractErrorMessage(error, 'Não foi possível carregar a lista de usuários.')
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsuarios();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, currentUserId, updateProfileState]);

  const triggerReload = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchesProfile =
        selectedProfile === 'Todos' || usuario.perfil === selectedProfile;

      const matchesStatus =
        selectedStatus === 'Todos' ||
        (selectedStatus === 'Ativos' && usuario.ativo) ||
        (selectedStatus === 'Inativos' && !usuario.ativo);

      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        usuario.nome.toLowerCase().includes(normalizedSearch) ||
        usuario.email.toLowerCase().includes(normalizedSearch) ||
        String(usuario.id).includes(normalizedSearch) ||
        (usuario.matricula &&
          usuario.matricula.toLowerCase().includes(normalizedSearch)) ||
        (usuario.registroFuncional &&
          usuario.registroFuncional.toLowerCase().includes(normalizedSearch));

      return matchesProfile && matchesStatus && matchesSearch;
    });
  }, [usuarios, selectedProfile, selectedStatus, searchTerm]);

  const handleOpenCreateModal = () => {
    setUsuarioToEdit(null);
    setIsUsuarioModalOpen(true);
  };

  const handleOpenEditModal = (usuario: Usuario) => {
    setUsuarioToEdit(usuario);
    setIsUsuarioModalOpen(true);
  };

  const handleModalSuccess = (message: string) => {
    setFeedbackMessage(message);
    triggerReload();
  };

  const handleConfirmDeactivate = async (usuario: Usuario) => {
    setIsDeactivating(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const response = await usuarioService.deactivate(usuario.id);
      setFeedbackMessage(response.mensagem || 'Usuário desativado com sucesso!');
      setUsuarioToDeactivate(null);
      triggerReload();
    } catch (error: unknown) {
      setErrorMessage(
        extractErrorMessage(error, 'Falha ao desativar a conta do usuário.')
      );
      setUsuarioToDeactivate(null);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Usuários
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Consulte, filtre e gerencie contas de Administradores, Professores e Alunos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerReload}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4" />
              <span>Novo Usuário</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback & Error Alerts */}
      {feedbackMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dispensar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-rose-700 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Dynamic Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Search Input */}
          <div className="relative md:col-span-5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail, ID ou matrícula..."
              aria-label="Buscar usuários"
              className="block w-full rounded-xl border border-slate-300 py-2 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
            />
          </div>

          {/* Profile Filter */}
          <div className="flex items-center gap-2 md:col-span-4">
            <Filter className="h-4 w-4 shrink-0 text-slate-400" />
            <label
              htmlFor="filter-perfil"
              className="text-xs font-semibold text-slate-600"
            >
              Perfil:
            </label>
            <select
              id="filter-perfil"
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value as ProfileFilter)}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
            >
              <option value="Todos">Todos os Perfis</option>
              <option value="Administrador">Administrador</option>
              <option value="Professor">Professor</option>
              <option value="Aluno">Aluno</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 md:col-span-3">
            <label
              htmlFor="filter-status"
              className="text-xs font-semibold text-slate-600"
            >
              Status:
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
            >
              <option value="Todos">Todos</option>
              <option value="Ativos">Ativos</option>
              <option value="Inativos">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Carregando usuários cadastrados...
            </p>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              Nenhum usuário encontrado
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              {usuarios.length === 0
                ? 'Ainda não há usuários registrados na base de dados.'
                : 'Nenhum registro corresponde aos filtros de perfil, status ou termo de busca selecionados.'}
            </p>
            {(selectedProfile !== 'Todos' ||
              selectedStatus !== 'Todos' ||
              searchTerm.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProfile('Todos');
                  setSelectedStatus('Todos');
                  setSearchTerm('');
                }}
                className="mt-4 rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    E-mail
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Perfil / Vínculo
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Status
                  </th>
                  {isAdmin && (
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsuarios.map((usuario) => {
                  const isSelf = currentUserId === usuario.id;

                  return (
                    <tr
                      key={usuario.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-medium whitespace-nowrap text-slate-500">
                        #{usuario.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {usuario.nome}
                          </span>
                          {isSelf && (
                            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getProfileBadgeClasses(
                              usuario.perfil
                            )}`}
                          >
                            {usuario.perfil}
                          </span>
                          {usuario.perfil === 'Aluno' && usuario.matricula && (
                            <span className="text-[11px] text-slate-500">
                              Matrícula: {usuario.matricula}
                            </span>
                          )}
                          {usuario.perfil === 'Professor' &&
                            usuario.registroFuncional && (
                              <span className="text-[11px] text-slate-500">
                                RF: {usuario.registroFuncional}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usuario.ativo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            <UserCheck className="h-3 w-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                            <UserX className="h-3 w-3" />
                            Inativo
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(usuario)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                              title="Editar dados do usuário"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </button>

                            {usuario.ativo && !isSelf && (
                              <button
                                type="button"
                                onClick={() => setUsuarioToDeactivate(usuario)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                                title="Desativar conta do usuário"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                <span>Desativar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Count */}
        {!isLoading && filteredUsuarios.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500">
            Exibindo <strong>{filteredUsuarios.length}</strong> de{' '}
            <strong>{usuarios.length}</strong> usuário(s) cadastrado(s).
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <UsuarioModal
        isOpen={isUsuarioModalOpen}
        usuarioToEdit={usuarioToEdit}
        onClose={() => setIsUsuarioModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Deactivation Confirmation Modal */}
      <ConfirmDeactivateModal
        usuario={usuarioToDeactivate}
        isSubmitting={isDeactivating}
        onCancel={() => setUsuarioToDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}
