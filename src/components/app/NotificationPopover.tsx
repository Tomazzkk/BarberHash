import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from '@/hooks/useSessionStore';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle, Star, Gift, CalendarClock, Crown, UserPlus, Scissors } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';

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

const NotificationPopover = () => {
    const { user } = useSessionStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(3);
            
            if (error) {
                console.error("Error fetching popover notifications:", error);
            } else {
                setNotifications(data as Notification[]);
            }
            setLoading(false);
        };
        fetchNotifications();
    }, [user]);

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        const toastId = showLoading("Marcando como lidas...");
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        
        dismissToast(toastId);
        if (error) {
            showError("Erro ao marcar notificações como lidas.");
        } else {
            showSuccess("Notificações marcadas como lidas.");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <div className="flex flex-col">
            <div className="p-4 flex justify-between items-center">
                <h4 className="font-semibold">Notificações</h4>
                {hasUnread && (
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleMarkAllAsRead}>Marcar como lidas</Button>
                )}
            </div>
            <Separator />
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : notifications.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-4">Nenhuma notificação nova.</p>
                ) : (
                    notifications.map(notif => {
                        const Icon = notificationIcons[notif.type] || notificationIcons.default;
                        return (
                            <div key={notif.id} className="flex items-start gap-3">
                                <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{notif.title}</p>
                                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            <Separator />
            <div className="p-2">
                <Button variant="ghost" className="w-full" asChild>
                    <Link to="/app/notificacoes">Ver todas as notificações</Link>
                </Button>
            </div>
        </div>
    );
};

export default NotificationPopover;