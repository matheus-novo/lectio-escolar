import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AcessoNegado } from '../pages/AcessoNegado';
import { Usuarios } from '../pages/admin/Usuarios';
import { Dashboard } from '../pages/Dashboard';
import { Login } from '../pages/Login';
import { Perfil } from '../pages/Perfil';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/painel" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/acesso-negado" element={<AcessoNegado />} />

          {/* Routes restricted by Role */}
          <Route
            element={<ProtectedRoute allowedRoles={['Administrador', 'Professor']} />}
          >
            <Route path="/admin/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      {/* Default Fallback */}
      <Route path="/" element={<Navigate to="/painel" replace />} />
      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Routes>
  );
}

