import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AcessoNegado() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">Acesso Restrito</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Seu perfil de usuário não possui permissão para visualizar a página solicitada.
      </p>
      <Link
        to="/painel"
        className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-2xs transition hover:bg-indigo-700"
      >
        Voltar ao Painel Principal
      </Link>
    </div>
  );
}

