import { useSessionStore, BarberPermissions, ProfileRole } from '@/hooks/useSessionStore';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';
import React from 'react';

type ProtectedRouteProps = {
  roles: Array<ProfileRole>;
  feature?: string;
  permission?: keyof BarberPermissions;
  children: React.ReactNode;
};

const ProtectedRoute = ({ roles, feature, permission, children }: ProtectedRouteProps) => {
  const { session, profile, plan, loading, permissions } = useSessionStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4 w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-primary">Carregando...</h2>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRole = roles.includes(profile.role);
  if (!hasRole) {
    if (profile.role === 'cliente_final') return <Navigate to="/app/home" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if ((profile.role === 'barbeiro' || profile.role === 'supervisor') && permission) {
    const hasPermission = permissions?.[permission] ?? false;
    if (!hasPermission) {
        return <Navigate to="/dashboard" replace />;
    }
  }

  // O 'dono' sempre tem acesso, independentemente do plano.
  // Outros perfis (como 'gerente') precisam que a feature esteja no plano.
  if (feature && profile.role !== 'dono') {
    const hasFeature = plan?.features?.includes(feature);
    if (!hasFeature) {
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;