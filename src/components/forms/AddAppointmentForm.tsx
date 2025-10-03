import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, PlusCircle } from "lucide-react";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";

const formSchema = z.object({
  cliente_id: z.string().uuid({ message: "Selecione um cliente." }),
  servico_id: z.string().uuid({ message: "Selecione um serviço." }),
  barbeiro_id: z.string().uuid({ message: "Selecione um barbeiro." }),
  date: z.date({ required_error: "A data é obrigatória." }),
  start_time: z.string({ required_error: "Selecione um horário." }),
  notes: z.string().optional(),
});

type Client = { id: string; name: string; phone: string | null };
type Service = { id: string; name: string; duration_minutes: number };
type Barber = { id: string; name: string };
type AppointmentForForm = {
  id: string;
  cliente_id: string;
  servico_id: string;
  barbeiro_id: string | null;
  start_time: string;
  notes: string | null;
};

type AddAppointmentFormProps = {
  onSuccess: () => void;
  appointment?: AppointmentForForm | null;
  selectedDate?: Date;
  sedeId: string;
};

const AddAppointmentForm = ({ onSuccess, appointment, selectedDate, sedeId }: AddAppointmentFormProps) => {
  const { ownerId } = useSessionStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);

  const fetchClients = async () => {
    if (!ownerId) return;
    const { data: clientsData } = await supabase.from("clientes").select("id, name, phone").eq("user_id", ownerId).order("name");
    setClients(clientsData || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      fetchClients();
      const { data: servicesData } = await supabase.from("servicos").select("id, name, duration_minutes").eq("sede_id", sedeId);
      setServices(servicesData || []);
      const { data: barbersData } = await supabase.from("barbeiros").select("id, name").eq("sede_id", sedeId);
      setBarbers(barbersData || []);
    };
    fetchData();
  }, [sedeId, ownerId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_id: appointment?.cliente_id || undefined,
      servico_id: appointment?.servico_id || undefined,
      barbeiro_id: appointment?.barbeiro_id || undefined,
      date: appointment ? new Date(appointment.start_time) : selectedDate || new Date(),
      start_time: appointment ? format(new Date(appointment.start_time), 'HH:mm') : undefined,
      notes: appointment?.notes || "",
    },
  });

  const watchDate = form.watch("date");
  const watchBarber = form.watch("barbeiro_id");
  const watchService = form.watch("servico_id");

  const { availableSlots, loadingSlots } = useAvailableSlots(watchDate, watchBarber, watchService);

  useEffect(() => {
    form.resetField("start_time");
  }, [watchDate, watchBarber, watchService, form]);

  const handleClientFormSuccess = async () => {
    setIsClientFormOpen(false);
    await fetchClients();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!ownerId) {
      showError("Você precisa estar logado como dono ou membro da equipe.");
      return;
    }

    const toastId = showLoading(appointment ? "Atualizando agendamento..." : "Criando agendamento...");
    
    const selectedService = services.find(s => s.id === values.servico_id);
    if (!selectedService) {
        dismissToast(toastId);
        showError("Serviço selecionado não encontrado.");
        return;
    }

    const [hours, minutes] = values.start_time.split(':').map(Number);
    const startTime = new Date(values.date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);

    const appointmentData = {
      cliente_id: values.cliente_id,
      servico_id: values.servico_id,
      barbeiro_id: values.barbeiro_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      notes: values.notes,
      user_id: ownerId,
      status: 'confirmado',
      sede_id: sedeId,
    };

    let error;
    if (appointment) {
      const { error: updateError } = await supabase.from("agendamentos").update(appointmentData).eq("id", appointment.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("agendamentos").insert([appointmentData]);
      error = insertError;
    }

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar agendamento: ${error.message}`);
    } else {
      showSuccess(`Agendamento ${appointment ? 'atualizado' : 'criado'} com sucesso!`);
      
      const selectedClient = clients.find(c => c.id === values.cliente_id);
      if (selectedClient?.phone) {
        const message = `Olá, ${selectedClient.name}! Seu agendamento para ${selectedService.name} no dia ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi confirmado.`;
        supabase.functions.invoke('send-whatsapp', { body: { to: selectedClient.phone, message } })
          .then(({ error: funcError }) => {
            if (funcError) console.error("Erro ao enviar notificação:", funcError.message);
          });
      }

      form.reset();
      onSuccess();
    }
  }

  return (
    <>
    <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
            <ClientForm onSuccess={handleClientFormSuccess} />
        </DialogContent>
    </Dialog>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="cliente_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Select onValueChange={(value) => {
                if (value === 'add_new') {
                    setIsClientFormOpen(true);
                } else {
                    field.onChange(value);
                }
            }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="add_new" className="font-semibold text-primary">
                    <div className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Criar Novo Cliente</div>
                </SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="servico_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Serviço</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger></FormControl>
              <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="barbeiro_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Barbeiro</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione um barbeiro" /></SelectTrigger></FormControl>
              <SelectContent>{barbers.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="start_time" render={({ field }) => (
            <FormItem>
              <FormLabel>Horário de Início</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={loadingSlots || availableSlots.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    {loadingSlots ? <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</div> : <SelectValue placeholder="Selecione um horário" />}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl><Textarea placeholder="Detalhes do agendamento" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Agendamento"}
        </Button>
      </form>
    </Form>
    </>
  );
};

export default AddAppointmentForm;