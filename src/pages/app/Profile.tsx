import { useSessionStore } from '@/hooks/useSessionStore';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAvatarUrl } from '@/utils/avatar';
import { Edit, Scissors, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { showError } from '@/utils/toast';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

type Appointment = {
  id: string;
  start_time: string;
  status: 'confirmado' | 'concluido' | 'cancelado' | 'pending_payment';
  servicos: { id: string; name: string, price: number } | null;
  barbeiros: { id: string; name: string, avatar_url: string | null } | null;
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const ProfilePage = () => {
  const { user, profile, loyaltyProgress, loading: sessionLoading } = useSessionStore();
  const navigate = useNavigate();
  const [history, setHistory] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ cuts: 0, spent: 0 });
  const [loading, setLoading] = useState(true);
  const unreadCount = useUnreadNotifications();

  const fetchData = useCallback(async () => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);

    const { data: clientData } = await supabase.from('clientes').select('id').eq('email', user.email).single();
    if (!clientData) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, start_time, status, servicos(id, name, price), barbeiros(id, name, avatar_url)')
      .eq('cliente_id', clientData.id)
      .order('start_time', { ascending: false });

    if (error) {
      console.error(error);
      setHistory([]);
    } else {
      setHistory(data as Appointment[]);
      const now = new Date();
      const completedAppointments = data.filter(a => 
        a.status === 'concluido' || 
        (a.status === 'confirmado' && new Date(a.start_time) < now)
      );
      const totalSpent = completedAppointments.reduce((sum, a) => sum + (a.servicos?.price || 0), 0);
      setStats({ cuts: completedAppointments.length, spent: totalSpent });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchData();
    }
  }, [sessionLoading, fetchData]);

  const handleRebook = (apt: Appointment) => {
    if (apt.servicos?.id && apt.barbeiros?.id) {
        navigate('/app/agendar', { state: { servico_id: apt.servicos.id, barbeiro_id: apt.barbeiros.id } });
    } else {
        showError("Não foi possível obter os detalhes para reagendar.");
    }
  };

  if (sessionLoading || loading) {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between"><Skeleton className="h-10 w-10 rounded-md" /><Skeleton className="h-6 w-24 rounded-md" /><Skeleton className="h-10 w-10 rounded-md" /></div>
            <div className="flex flex-col items-center space-y-3"><Skeleton className="h-24 w-24 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-40 rounded-md" /><Skeleton className="h-5 w-48 rounded-md" /></div><Skeleton className="h-10 w-32 rounded-md" /></div>
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-20 w-full rounded-lg" /></div>
        </div>
    );
  }

  const LoyaltyStamp = ({ active }: { active: boolean }) => (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${active ? 'bg-primary' : 'bg-muted border-2 border-dashed border-muted-foreground/50'}`}>
      <Scissors className={`h-6 w-6 ${active ? 'text-primary-foreground' : 'text-muted-foreground/50'}`} />
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="w-8" /> {/* Spacer */}
        <h1 className="text-lg font-bold text-center">Meu Perfil</h1>
        <div className="relative">
            <Button variant="ghost" size="icon" asChild>
                <Link to="/app/notificacoes">
                    <Bell className="h-6 w-6" />
                </Link>
            </Button>
            {unreadCount > 0 && (
                <Link to="/app/notificacoes" className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </Link>
            )}
        </div>
      </header>

      <section className="flex flex-col items-center text-center space-y-3">
        <Avatar className="h-24 w-24 text-3xl border-2 border-primary">
          <AvatarImage src={getAvatarUrl(profile?.full_name, profile?.avatar_url)} />
          <AvatarFallback>{getInitials(profile?.full_name || '..')}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/app/configuracoes">
            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
          </Link>
        </Button>
      </section>

      {loyaltyProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Cartão Fidelidade</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="flex justify-between w-full items-baseline mb-4">
              <p className="text-sm text-muted-foreground">Cortes realizados</p>
              <p className="font-bold">{loyaltyProgress.current_count}/{loyaltyProgress.target_count}</p>
            </div>
            <div className="grid grid-cols-5 gap-4 w-full">
              {Array.from({ length: loyaltyProgress.target_count }).map((_, i) => (
                <LoyaltyStamp key={i} active={i < loyaltyProgress.current_count} />
              ))}
            </div>
            <p className="mt-4 text-center font-medium text-primary">
              Faltam apenas {loyaltyProgress.target_count - loyaltyProgress.current_count} cortes para ganhar um CORTE GRÁTIS!
            </p>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">Histórico de Agendamentos</h3>
          <Button variant="link" asChild>
            <Link to="/app/historico">Ver todos</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {history.slice(0, 3).map(apt => (
            <Card key={apt.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={getAvatarUrl(apt.barbeiros?.name, apt.barbeiros?.avatar_url)} />
                    <AvatarFallback>{getInitials(apt.barbeiros?.name || '..')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{apt.barbeiros?.name}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(apt.start_time), "dd MMM yyyy '•' HH:mm", { locale: ptBR })}</p>
                    <p className="text-sm">{apt.servicos?.name}</p>
                  </div>
                </div>
                <Badge variant={apt.status === 'concluido' ? 'secondary' : apt.status === 'cancelado' ? 'destructive' : 'default'}>
                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                </Badge>
              </div>
              <div className="mt-3">
                {(apt.status === 'concluido' || apt.status === 'cancelado') && 
                    <Button className="w-full" variant={apt.status === 'concluido' ? 'secondary' : 'default'} onClick={() => handleRebook(apt)}>
                        {apt.status === 'concluido' ? 'Repetir Agendamento' : 'Reagendar'}
                    </Button>
                }
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.cuts}</p>
          <p className="text-sm text-muted-foreground">Cortes realizados</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">R$ {stats.spent.toFixed(2).replace('.', ',')}</p>
          <p className="text-sm text-muted-foreground">Total investido</p>
        </Card>
      </section>
    </div>
  );
};

export default ProfilePage;