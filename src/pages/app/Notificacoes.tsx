import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { formatDistanceToNow, isToday, isThisWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, CheckCircle, AlertCircle, Star, Gift, CalendarClock, Crown, UserPlus, Scissors, X, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

const notificationIcons: { [key: string]: React.ElementType } = {
    appointment_confirmed: CheckCircle,
    appointment_reminder: AlertCircle,
    review_request: Star,
    promotion: Gift,
    new_slot: CalendarClock,
    plan_activated: Crown,
    welcome: UserPlus,
    first_appointment: Scissors,
    team_invitation: UserPlus,
    default: Bell,
};

const groupNotifications = (notifications: Notification[]) => {
  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const older: Notification[] = [];

  notifications.forEach(n => {
    const date = parseISO(n.created_at);
    if (isToday(date)) {
      today.push(n);
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      thisWeek.push(n);
    } else {
      older.push(n);
    }
  });

  return { today, thisWeek, older };
};

const Notificacoes = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useSessionStore();
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        
        if (error) {
            showError("Erro ao buscar notificações.");
        } else {
            setNotifications(data as Notification[]);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const groupedNotifications = useMemo(() => groupNotifications(notifications), [notifications]);

    const handleDelete = async (id: string) => {
        const toastId = showLoading("Excluindo...");
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        dismissToast(toastId);
        if (error) {
            showError("Erro ao excluir notificação.");
        } else {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const handleAcceptInvitation = async (id: string) => {
        const toastId = showLoading("Aceitando convite...");
        const { error } = await supabase.functions.invoke('accept-team-invitation', {
            body: { notificationId: id }
        });
        dismissToast(toastId);
        if (error) {
            showError(`Erro ao aceitar: ${error.message}`);
        } else {
            showSuccess("Parabéns! Você agora é um barbeiro. Por favor, faça login novamente para acessar suas novas ferramentas.");
            await logout();
            navigate('/login');
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        const toastId = showLoading("Marcando como lidas...");
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
        dismissToast(toastId);
        if (error) {
            showError("Erro ao marcar notificações.");
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            showSuccess("Todas as notificações foram marcadas como lidas.");
        }
    };

    return (
        <div className="pb-24">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold">Notificações</h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleMarkAllAsRead}>Marcar todas como lidas</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : notifications.length === 0 ? (
                <EmptyState
                    icon={<Bell className="h-12 w-12" />}
                    title="Nenhuma notificação"
                    description="Quando houver novidades, elas aparecerão aqui."
                />
            ) : (
                <div className="space-y-8">
                    {groupedNotifications.today.length > 0 && (
                        <NotificationSection title="Hoje" notifications={groupedNotifications.today} onDelete={handleDelete} onAccept={handleAcceptInvitation} />
                    )}
                    {groupedNotifications.thisWeek.length > 0 && (
                        <NotificationSection title="Essa Semana" notifications={groupedNotifications.thisWeek} onDelete={handleDelete} onAccept={handleAcceptInvitation} />
                    )}
                    {groupedNotifications.older.length > 0 && (
                        <NotificationSection title="Mais Antigas" notifications={groupedNotifications.older} onDelete={handleDelete} onAccept={handleAcceptInvitation} />
                    )}
                </div>
            )}

            {notifications.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 p-4">
                    <div className="max-w-2xl mx-auto">
                        <Button size="lg" className="w-full" onClick={handleMarkAllAsRead}>
                            Marcar Todas como Lidas
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const NotificationSection = ({ title, notifications, onDelete, onAccept }: { title: string, notifications: Notification[], onDelete: (id: string) => void, onAccept: (id: string) => void }) => (
    <section>
        <h2 className="text-sm font-bold uppercase text-muted-foreground mb-3">{title}</h2>
        <div className="space-y-3">
            {notifications.map((notif) => {
                const Icon = notificationIcons[notif.type] || notificationIcons.default;
                return (
                    <div key={notif.id} className="bg-muted/50 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex items-start gap-4">
                            <div className="bg-background p-2 rounded-full mt-1">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold">{notif.title}</p>
                                <p className="text-sm text-muted-foreground">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>
                            {notif.type !== 'team_invitation' && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(notif.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {notif.type === 'team_invitation' && (
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => onDelete(notif.id)}>Recusar</Button>
                                <Button size="sm" onClick={() => onAccept(notif.id)}>Aceitar</Button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </section>
);

export default Notificacoes;