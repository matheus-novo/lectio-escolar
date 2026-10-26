import {
  BookOpen,
  Library,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logoLectio from '../../assets/logo-lectio-escolar.jpg';
import { useAuth } from '../../contexts/AuthContext';
import type { PerfilUsuario } from '../../types';

interface NavMenuItem {
  label: string;
  to: string;
  icon: typeof Library;
  allowedRoles: PerfilUsuario[];
}

const MENU_ITEMS: NavMenuItem[] = [
  {
    label: 'Início da Biblioteca',
    to: '/painel',
    icon: Library,
    allowedRoles: ['Administrador', 'Professor', 'Aluno'],
  },
  {
    label: 'Usuários',
    to: '/admin/usuarios',
    icon: Users,
    allowedRoles: ['Administrador', 'Professor'],
  },
  {
    label: 'Meu Perfil',
    to: '/perfil',
    icon: UserCircle,
    allowedRoles: ['Administrador', 'Professor', 'Aluno'],
  },
];

function getRoleBadgeStyle(role: PerfilUsuario | null): string {
  switch (role) {
    case 'Administrador':
      return 'bg-slate-200 text-[#0d2949] border-slate-300';
    case 'Professor':
      return 'bg-blue-100 text-[#0d2949] border-blue-200';
    case 'Aluno':
      return 'bg-emerald-100 text-[#175a3a] border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function MainLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [forbiddenAlert, setForbiddenAlert] = useState<string | null>(null);

  useEffect(() => {
    const handleForbidden = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      setForbiddenAlert(
        customEvent.detail?.message ??
          'Você não possui permissão para realizar esta operação.'
      );
    };

    window.addEventListener('lectio:forbidden', handleForbidden);
    return () => {
      window.removeEventListener('lectio:forbidden', handleForbidden);
    };
  }, []);

  const visibleMenuItems = MENU_ITEMS.filter(
    (item) => role && item.allowedRoles.includes(role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userInitials = user?.nome
    ? user.nome
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'LE';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <img
              src={logoLectio}
              alt="Logo Lectio Escolar"
              className="h-12 w-12 rounded-xl border border-slate-200/80 object-contain bg-white p-0.5 shadow-2xs"
            />
            <div>
              <span className="block text-base font-bold tracking-tight text-[#0d2949]">
                Lectio Escolar
              </span>
              <span className="block text-xs font-medium text-[#175a3a]">
                Biblioteca Pública Virtual
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logged User Card */}
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0d2949] text-sm font-bold text-white">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.nome}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeStyle(
                    role
                  )}`}
                >
                  {role === 'Administrador' && <ShieldCheck className="h-3 w-3" />}
                  {role === 'Professor' && <BookOpen className="h-3 w-3" />}
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Menu da Biblioteca
          </p>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0d2949] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0d2949]'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menu lateral"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-[#0d2949] sm:text-base">
                Biblioteca Virtual
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Acervo de materiais e livros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.nome}</p>
              <p className="text-xs text-slate-500">Perfil: {role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sair da Biblioteca"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-rose-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Global 403 Alert Banner if triggered */}
        {forbiddenAlert && (
          <div className="mx-4 mt-4 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-8">
            <span>{forbiddenAlert}</span>
            <button
              type="button"
              onClick={() => setForbiddenAlert(null)}
              className="ml-4 font-semibold text-amber-800 hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Route Content */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
