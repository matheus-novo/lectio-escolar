import {
  ArrowRight,
  BookOpen,
  Library,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-linear-to-r from-[#0d2949] to-[#175a3a] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-xs">
              {role === 'Administrador' && <ShieldCheck className="h-3.5 w-3.5" />}
              {role === 'Professor' && <BookOpen className="h-3.5 w-3.5" />}
              {role === 'Aluno' && <Library className="h-3.5 w-3.5" />}
              Perfil {role}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Olá, {user?.nome}!
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-100">
              Bem-vindo(a) à <strong>Lectio Escolar</strong>, a Biblioteca Pública
              Virtual dedicada ao compartilhamento de livros, obras literárias e
              materiais de apoio de professores para alunos do ensino fundamental e médio
              da rede pública de ensino.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {(role === 'Administrador' || role === 'Professor') && (
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition hover:border-[#0d2949]/30 hover:shadow-md">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#0d2949]">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Comunidade de Leitores e Professores
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {role === 'Administrador'
                  ? 'Cadastre e gerencie o acesso de Administradores, Professores colaboradores do acervo e Alunos leitores da rede pública.'
                  : 'Consulte a listagem de leitores (alunos) e professores cadastrados na Biblioteca Pública Virtual.'}
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/admin/usuarios"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0d2949] hover:text-[#175a3a]"
              >
                <span>Acessar Gestão de Usuários</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition hover:border-[#175a3a]/30 hover:shadow-md">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#175a3a]">
              <UserCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Meu Perfil e Credenciais
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Confira seus dados de cadastro na biblioteca virtual, número de matrícula ou
              registro funcional, e realize a alteração segura da sua senha.
            </p>
          </div>
          <div className="mt-6">
            <Link
              to="/perfil"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#175a3a] hover:text-[#0d2949]"
            >
              <span>Visualizar Meu Perfil</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
