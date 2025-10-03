import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Scissors, User, Check, X, Ban, Hourglass, Repeat, CalendarPlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import ReviewForm from "@/components/forms/ReviewForm";
import EmptyState from "@/components/EmptyState";

type AppointmentHistory = {
  id: string;
  start_time: string;
  end_time: string;
  status: 'confirmado' | 'concluido' | 'cancelado' | 'pending_payment';
  servico_id: string | null;
  barbeiro_id: string | null;
  cliente_id: string;
  sede_id: string;
  servicos: { name: string } | null;
  barbeiros: { name: string } | null;
  clientes: { phone: string | null, user_id: string } | null;
  avaliacoes: { id: string }[] | null;
};

const statusConfig = {
  concluido: { label: "Concluído", icon: <Check className="h-4 w-4" />, badgeVariant: "secondary" as const, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  confirmado: { label: "Confirmado", icon: <Calendar className="h-4 w-4" />, badgeVariant: "default" as const, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  pending_payment: { label: "Pendente", icon: <Hourglass className="h-4 w-4" />, badgeVariant: "outline" as const, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
  cancelado: { label: "Cancelado", icon: <X className="h-4 w-4" />, badgeVariant: "destructive" as const, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const AppointmentCard = ({ apt, onCancel, onRebook, onAddToCalendar, onOpenReview }: { apt: AppointmentHistory, onCancel: (apt: AppointmentHistory) => void, onRebook: (apt: AppointmentHistory) => void, onAddToCalendar: (apt: AppointmentHistory) => void, onOpenReview: (apt: AppointmentHistory) => void }) => {
    const config = statusConfig[apt.status] || statusConfig.confirmado;
    const isCancellable = (apt.status === 'confirmado' || apt.status === 'pending_payment') && new Date(apt.start_time) > new Date();
    const isRebookable = apt.status === 'concluido';
    const isCalendarable = apt.status === 'confirmado' || apt.status === 'concluido';
    const canReview = apt.status === 'concluido' && (!apt.avaliacoes || apt.avaliacoes.length === 0);

    return (
        <div className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg flex items-center gap-2"><Scissors className="h-4 w-4 text-primary" />{apt.servicos?.name || "Serviço"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><User className="h-4 w-4" />{apt.barbeiros?.name || "Barbeiro"}</p>
                </div>
                <Badge variant={config.badgeVariant} className={config.className}>{config.icon}<span className="ml-2">{config.label}</span></Badge>
            </div>
            <div className="text-sm text-foreground font-medium flex items-center gap-2 pt-3 border-t border-dashed"><Calendar className="h-4 w-4 text-muted-foreground" />{format(new Date(apt.start_time), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</div>
            <div className="pt-3 border-t flex items-center gap-2 flex-wrap">
                {isCalendarable && <Button variant="outline" size="sm" onClick={() => onAddToCalendar(apt)}><CalendarPlus className="mr-2 h-4 w-4" />Adicionar ao Calendário</Button>}
                {isRebookable && <Button variant="outline" size="sm" onClick={() => onRebook(apt)}><Repeat className="mr-2 h-4 w-4" />Reagendar</Button>}
                {canReview && <Button variant="outline" size="sm" onClick={() => onOpenReview(apt)}><Star className="mr-2 h-4 w-4" />Deixar Avaliação</Button>}
                {isCancellable && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Ban className="mr-2 h-4 w-4" />Cancelar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Confirmar cancelamento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Se houver clientes na lista de espera, eles serão notificados sobre o horário vago.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Manter</AlertDialogCancel><AlertDialogAction onClick={() => onCancel(apt)} className="bg-destructive hover:bg-destructive/90">Sim, cancelar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
};

const Historico = () => {
    const [appointments, setAppointments] = useState<AppointmentHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, config } = useSessionStore();
    const navigate = useNavigate();
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<AppointmentHistory | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        const { data: clientData } = await supabase.from('clientes').select('id').eq('email', user.email).single();
        if (!clientData) { setAppointments([]); setLoading(false); return; }
        const { data, error } = await supabase.from("agendamentos").select(`id, start_time, end_time, status, servico_id, barbeiro_id, cliente_id, sede_id, servicos(name), barbeiros(name), clientes(phone, user_id), avaliacoes(id)`).eq("cliente_id", clientData.id).order("start_time", { ascending: false });
        if (error) { showError("Erro ao buscar seu histórico: " + error.message); setAppointments([]); } 
        else { setAppointments(data as unknown as AppointmentHistory[]); }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const sortedAppointments = useMemo(() => {
        const now = new Date();
        const upcoming: AppointmentHistory[] = [];
        const past: AppointmentHistory[] = [];
        appointments.forEach(apt => {
            const aptDate = parseISO(apt.start_time);
            if ((apt.status === 'confirmado' || apt.status === 'pending_payment') && aptDate >= now) {
                upcoming.push(apt);
            } else {
                past.push(apt);
            }
        });
        upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        return { upcoming, past };
    }, [appointments]);

    const handleCancel = async (appointment: AppointmentHistory) => {
        const toastId = showLoading("Cancelando agendamento...");
        const { data, error } = await supabase.functions.invoke('handle-cancellation', { body: { appointmentId: appointment.id } });
        dismissToast(toastId);
        if (error) { showError(`Erro ao cancelar: ${error.message}`); } 
        else { showSuccess(data.message || "Agendamento cancelado!"); fetchHistory(); }
    };

    const handleRebook = (apt: AppointmentHistory) => {
        if (apt.servico_id && apt.barbeiro_id) { navigate('/app/agendar', { state: { servico_id: apt.servico_id, barbeiro_id: apt.barbeiro_id } }); } 
        else { showError("Não foi possível obter os detalhes para reagendar."); }
    };

    const handleAddToCalendar = (appointment: AppointmentHistory) => {
        const title = `Corte de Cabelo: ${appointment.servicos?.name}`;
        const description = `Seu agendamento com ${appointment.barbeiros?.name}.`;
        const start = parseISO(appointment.start_time);
        const end = parseISO(appointment.end_time);
        const formatDateForICS = (date: Date) => date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
        const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BarberPro//App//EN', 'BEGIN:VEVENT', `UID:${appointment.id}@barberpro.app`, `DTSTAMP:${formatDateForICS(new Date())}`, `DTSTART:${formatDateForICS(start)}`, `DTEND:${formatDateForICS(end)}`, `SUMMARY:${title}`, `DESCRIPTION:${description}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        try {
            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'agendamento.ics');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) { showError("Não foi possível gerar o arquivo do calendário."); console.error(error); }
    };

    const handleOpenReview = (apt: AppointmentHistory) => { setSelectedAppointmentForReview(apt); setIsReviewFormOpen(true); };
    const handleReviewSuccess = () => { setIsReviewFormOpen(false); setSelectedAppointmentForReview(null); fetchHistory(); };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Seu Histórico</h1>
            {loading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
            ) : appointments.length === 0 ? (
                <EmptyState icon={<Calendar className="h-12 w-12" />} title="Nenhum agendamento" description="Você ainda não tem agendamentos. Que tal marcar seu primeiro horário?" />
            ) : (
                <div className="space-y-8">
                    {sortedAppointments.upcoming.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold mb-4">Próximos Agendamentos</h2>
                            <div className="space-y-4">
                                {sortedAppointments.upcoming.map(apt => <AppointmentCard key={apt.id} apt={apt} onCancel={handleCancel} onRebook={handleRebook} onAddToCalendar={handleAddToCalendar} onOpenReview={handleOpenReview} />)}
                            </div>
                        </section>
                    )}
                    {sortedAppointments.past.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold mb-4">Histórico</h2>
                            <div className="space-y-4">
                                {sortedAppointments.past.map(apt => <AppointmentCard key={apt.id} apt={apt} onCancel={handleCancel} onRebook={handleRebook} onAddToCalendar={handleAddToCalendar} onOpenReview={handleOpenReview} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
            {selectedAppointmentForReview && config && (
                <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
                    <DialogContent><DialogHeader><DialogTitle>Avalie sua experiência</DialogTitle></DialogHeader><ReviewForm appointmentId={selectedAppointmentForReview.id} barberId={selectedAppointmentForReview.barbeiro_id!} clientId={selectedAppointmentForReview.cliente_id} ownerId={config.user_id} sedeId={selectedAppointmentForReview.sede_id!} onSuccess={handleReviewSuccess} /></DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default Historico;