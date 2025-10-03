import { useSessionStore } from '@/hooks/useSessionStore';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const Home = () => {
  const { profile, loading } = useSessionStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="w-full max-w-md p-8 space-y-4">
            <h2 className="text-2xl font-bold text-primary">Carregando...</h2>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  switch (profile.role) {
    case 'admin': // Handle legacy admin role
    case 'dono':
    case 'barbeiro':
    case 'gerente':
    case 'supervisor':
      return <Navigate to="/dashboard" replace />;
    case 'cliente_final':
      return <Navigate to="/app/home" replace />;
    default:
      // Fallback para a página de login se o perfil não tiver uma role válida
      return <Navigate to="/login" replace />;
  }
};

export default Home;