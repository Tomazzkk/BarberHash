import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import AddAppointmentForm from "@/components/forms/AddAppointmentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, CheckCircle, CreditCard, Hourglass, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: 'confirmado' | 'cancelado' | 'concluido' | 'pending_payment';
  notes: string | null;
  cliente_id: string;
  servico_id: string;
  barbeiro_id: string | null;
  clientes: { name: string } | null;
  servicos: { name: string, price: number } | null;
  barbeiros: { name: string } | null;
};

type Barber = {
  id: string;
  name: string;
};

const Agenda = () => {
  const { profile, barberId: loggedInBarberId, permissions, selectedSede } = useSessionStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState("calendar");

  const canSeeAllAgendas = profile?.role !== 'barbeiro' || permissions?.pode_ver_agenda_completa;

  useEffect(() => {
    if (!canSeeAllAgendas && loggedInBarberId) {
      setSelectedBarber(loggedInBarberId);
    } else {
      setSelectedBarber('all');
    }
  }, [profile, loggedInBarberId, canSeeAllAgendas]);

  const fetchAppointments = useCallback(async (selectedDate: Date | undefined, barberId: string) => {
    if (!selectedDate || !selectedSede) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let query = supabase
      .from("agendamentos")
      .select("*, clientes(name), servicos(name, price), barbeiros(name)")
      .eq("sede_id", selectedSede.id)
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString());

    if (barberId !== 'all') {
      query = query.eq('barbeiro_id', barberId);
    }
    
    query = query.order("start_time", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching appointments:", error);
      showError("Erro ao buscar agendamentos: " + error.message);
      setAppointments([]);
    } else {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  }, [selectedSede]);

  useEffect(() => {
    const fetchBarbers = async () => {
        if (!selectedSede) {
            setBarbers([]);
            return;
        }
        let query = supabase.from("barbeiros").select("id, name").eq('sede_id', selectedSede.id);
        if (!canSeeAllAgendas && loggedInBarberId) {
            query = query.eq('id', loggedInBarberId);
        }
        const { data, error } = await query.order("name");

        if (error) {
            console.error("Error fetching barbers:", error);
            showError("Erro ao buscar barbeiros.");
        }
        else setBarbers(data || []);
    };
    fetchBarbers();
  }, [canSeeAllAgendas, loggedInBarberId, selectedSede]);

  useEffect(() => {
    fetchAppointments(date, selectedBarber);
  }, [date, selectedBarber, fetchAppointments]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedAppointment(null);
    fetchAppointments(date, selectedBarber);
  };

  const handleEdit = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAppointment(null);
    setIsFormOpen(true);
  };

  const handleCancel = async (appointmentId: string) => {
    const toastId = showLoading("Cancelando agendamento...");
    const { data, error } = await supabase.functions.invoke('handle-cancellation', {
        body: { appointmentId }
    });
    dismissToast(toastId);
    if (error) {
        console.error("Error cancelling appointment:", error);
        showError("Erro ao cancelar agendamento: " + error.message);
    } else {
        showSuccess(data.message || "Agendamento cancelado!");
        fetchAppointments(date, selectedBarber);
    }
  };

  const handleMarkAsCompleted = async (appointmentId: string) => {
    const toastId = showLoading("Finalizando agendamento...");
    const { error } = await supabase.functions.invoke('complete-appointment', { body: { appointmentId } });
    dismissToast(toastId);
    if (error) {
        console.error("Error completing appointment:", error);
        showError(`Erro ao finalizar agendamento: ${error.message}`);
    }
    else {
      showSuccess("Agendamento finalizado e lançado no financeiro!");
      fetchAppointments(date, selectedBarber);
    }
  };

  const handleConfirmPayment = async (appointmentId: string) => {
    const toastId = showLoading("Confirmando pagamento...");
    const { error } = await supabase.from("agendamentos").update({ status: 'confirmado' }).eq("id", appointmentId);
    dismissToast(toastId);
    if (error) {
        console.error("Error confirming payment:", error);
        showError("Erro ao confirmar pagamento: " + error.message);
    }
    else {
      showSuccess("Pagamento confirmado e agendamento efetivado!");
      fetchAppointments(date, selectedBarber);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
        case 'concluido':
            return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Concluído</Badge>;
        case 'pending_payment':
            return <Badge variant="outline" className="border-yellow-400 text-yellow-600 dark:border-yellow-600 dark:text-yellow-400">Pendente</Badge>;
        case 'cancelado':
            return <Badge variant="destructive">Cancelado</Badge>;
        default:
            return null;
    }
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (isMobile) {
        setMobileTab("appointments");
    }
  }

  const AgendaContent = () => (
    <Card>
        <CardHeader>
        <CardTitle>Agendamentos</CardTitle>
        <CardDescription>{date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}</CardDescription>
        </CardHeader>
        <CardContent>
        {loading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : appointments.length === 0 ? (
            <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento para esta data.</p>
            <Button onClick={handleAddNew} className="mt-4">Agendar Horário</Button>
            </div>
        ) : (
            <div className="space-y-4">
            {appointments.map((apt) => (
                <div key={apt.id} className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${apt.status === 'pending_payment' ? 'bg-yellow-50 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800' : apt.status === 'cancelado' ? 'opacity-60 bg-muted/50' : ''}`}>
                <div>
                    <p className="font-bold text-lg">{format(new Date(apt.start_time), "HH:mm")} - {format(new Date(apt.end_time), "HH:mm")}</p>
                    <p className="font-semibold">{apt.clientes?.name || "Cliente não encontrado"}</p>
                    <p className="text-sm opacity-80">{apt.servicos?.name || "Serviço não encontrado"} • <span className="font-medium">{apt.barbeiros?.name || "Sem barbeiro"}</span></p>
                    <div className="mt-2">{getStatusBadge(apt.status)}</div>
                </div>
                <AlertDialog>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {apt.status === 'pending_payment' && (<DropdownMenuItem onClick={() => handleConfirmPayment(apt.id)}><CreditCard className="mr-2 h-4 w-4 text-blue-500" /> Confirmar Pagamento</DropdownMenuItem>)}
                        {apt.status === 'confirmado' && (<DropdownMenuItem onClick={() => handleMarkAsCompleted(apt.id)}><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Finalizar</DropdownMenuItem>)}
                        <DropdownMenuItem onClick={() => handleEdit(apt)} disabled={apt.status === 'concluido' || apt.status === 'cancelado'}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        {apt.status !== 'cancelado' && apt.status !== 'concluido' && (
                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:text-red-600"><Ban className="mr-2 h-4 w-4" /> Cancelar</DropdownMenuItem></AlertDialogTrigger>
                        )}
                    </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Isso irá cancelar o agendamento. Clientes na lista de espera para este dia serão notificados sobre o horário vago.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Manter</AlertDialogCancel><AlertDialogAction onClick={() => handleCancel(apt.id)} className="bg-destructive hover:bg-destructive/90">Sim, Cancelar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </div>
            ))}
            </div>
        )}
        </CardContent>
    </Card>
  );

  if (!selectedSede && !loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md"><CardHeader><CardTitle>Nenhuma Sede Selecionada</CardTitle><CardDescription>Para gerenciar a agenda, você precisa primeiro selecionar ou criar uma sede.</CardDescription></CardHeader><CardContent><Button asChild><Link to="/sedes">Gerenciar Sedes</Link></Button></CardContent></Card>
        </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedAppointment(null); setIsFormOpen(isOpen); }}>
          <DialogTrigger asChild><Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Novo Agendamento</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{selectedAppointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle></DialogHeader>
            {selectedSede && <AddAppointmentForm onSuccess={handleFormSuccess} appointment={selectedAppointment} selectedDate={date} sedeId={selectedSede.id} />}
          </DialogContent>
        </Dialog>
      </div>
      
      {isMobile ? (
        <Tabs value={mobileTab} onValueChange={setMobileTab}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar">Calendário</TabsTrigger>
                <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className="mt-4">
                <div className="flex justify-center">
                    <Calendar mode="single" selected={date} onSelect={handleDateSelect} className="rounded-md border" locale={ptBR} />
                </div>
            </TabsContent>
            <TabsContent value="appointments" className="mt-4">
                <AgendaContent />
            </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 space-y-6">
                <Calendar mode="single" selected={date} onSelect={handleDateSelect} className="rounded-md border" locale={ptBR} />
                <Card>
                    <CardHeader><CardTitle className="text-base">Legenda</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-100 border border-green-200 dark:bg-green-900/20 dark:border-green-800"></span> Concluído</div>
                        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"></span> Pagamento Pendente</div>
                        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-muted/50 border"></span> Cancelado</div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                {canSeeAllAgendas ? (
                    <Tabs value={selectedBarber} onValueChange={setSelectedBarber}>
                        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${barbers.length + 1}, minmax(0, 1fr))`}}>
                            <TabsTrigger value="all">Todos</TabsTrigger>
                            {barbers.map((barber) => (
                                <TabsTrigger key={barber.id} value={barber.id}>{barber.name}</TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value={selectedBarber} className="mt-4">
                            <AgendaContent />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <AgendaContent />
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;