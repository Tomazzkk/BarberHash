import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Wallet, User, BellRing, MapPin } from "lucide-react";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { getDistance } from "@/utils/location";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const formSchema = z.object({
  servico_id: z.string().uuid({ message: "Selecione um serviço." }),
  barbeiro_id: z.string().uuid({ message: "Selecione um barbeiro." }),
  date: z.date({ required_error: "A data é obrigatória." }),
  start_time: z.string({ required_error: "Selecione um horário." }),
});

type Service = { id: string; name: string; duration_minutes: number; description: string | null; sinal_required?: boolean; sinal_value?: number; };
type Barber = { id: string; name: string; sede_id: string };
type Client = { id: string; phone: string | null };
type SedeWithCoords = { id: string; name: string; latitude: number | null; longitude: number | null; distance?: number };

type AppointmentFormProps = {
  onSuccess: () => void;
  prefillData?: { servico_id: string; barbeiro_id: string; } | null;
};

const AppointmentForm = ({ onSuccess, prefillData }: AppointmentFormProps) => {
  const { user, profile, config } = useSessionStore();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [sedes, setSedes] = useState<SedeWithCoords[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => {
        console.warn("Não foi possível obter a localização do usuário:", error.message);
      }
    );
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: servicesData } = await supabase.from("servicos").select("id, name, duration_minutes, description, sinal_required, sinal_value");
      setServices(servicesData || []);
      const { data: barbersData } = await supabase.from("barbeiros").select("id, name, sede_id");
      setBarbers(barbersData || []);
      const { data: sedesData } = await supabase.from("sedes").select("id, name, latitude, longitude");
      setSedes(sedesData || []);
      const { data: clientData } = await supabase.from("clientes").select("id, phone").eq("email", user.email).single();
      setClient(clientData);
    };
    fetchData();
  }, [user]);

  const sortedSedes = useMemo(() => {
    if (!userLocation) return sedes;
    return [...sedes]
      .map(sede => ({
        ...sede,
        distance: sede.latitude && sede.longitude ? getDistance(userLocation.lat, userLocation.lon, sede.latitude, sede.longitude) : Infinity,
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [sedes, userLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      servico_id: prefillData?.servico_id || undefined,
      barbeiro_id: prefillData?.barbeiro_id || undefined,
      date: new Date(),
    },
  });

  const watchDate = form.watch("date");
  const watchBarber = form.watch("barbeiro_id");
  const watchService = form.watch("servico_id");

  const { availableSlots, loadingSlots } = useAvailableSlots(watchDate, watchBarber, watchService);
  
  useEffect(() => {
    const checkWaitlist = async () => {
        if (!user || !watchBarber || !watchDate) {
            setIsOnWaitlist(false);
            return;
        }
        const { count } = await supabase
            .from('lista_espera')
            .select('*', { count: 'exact', head: true })
            .eq('client_user_id', user.id)
            .eq('barbeiro_id', watchBarber)
            .eq('data', format(watchDate, 'yyyy-MM-dd'));
        
        setIsOnWaitlist(count !== null && count > 0);
    };
    checkWaitlist();
  }, [user, watchBarber, watchDate]);

  const selectedService = useMemo(() => services.find(s => s.id === watchService), [services, watchService]);
  const requiresSinal = useMemo(() => config?.sinal_enabled && selectedService?.sinal_required && selectedService?.sinal_value, [config, selectedService]);

  useEffect(() => {
    form.resetField("start_time");
  }, [watchDate, watchBarber, watchService, form]);

  const handleJoinWaitlist = async () => {
    if (!user || !watchBarber || !watchDate) return;

    const { data: barberData } = await supabase
        .from('barbeiros')
        .select('user_id') // this is the owner_id
        .eq('id', watchBarber)
        .single();

    if (!barberData) {
        showError("Não foi possível encontrar o dono da barbearia.");
        return;
    }

    const toastId = showLoading("Entrando na lista de espera...");
    const { error } = await supabase.from('lista_espera').insert({
        owner_user_id: barberData.user_id,
        client_user_id: user.id,
        barbeiro_id: watchBarber,
        data: format(watchDate, 'yyyy-MM-dd'),
    });

    dismissToast(toastId);
    if (error) {
        showError(`Erro ao entrar na lista: ${error.message}`);
    } else {
        showSuccess("Você entrou na lista de espera! Avisaremos se um horário vagar.");
        setIsOnWaitlist(true);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !profile || !config) {
      showError("Você precisa estar logado para agendar.");
      return;
    }
    let currentClient = client;
    if (!currentClient) {
        const { data: newClient } = await supabase.from('clientes').insert({ 
            name: profile.full_name || 'Nome não definido', 
            email: user.email,
            user_id: config.user_id, // This is the owner_id
        }).select('id, phone').single();
        if (!newClient) {
            showError("Erro ao criar seu registro de cliente. Tente novamente.");
            return;
        }
        currentClient = newClient;
    }
    const toastId = showLoading("Criando agendamento...");
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
      cliente_id: currentClient.id,
      servico_id: values.servico_id,
      barbeiro_id: values.barbeiro_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      user_id: config.user_id,
      status: requiresSinal ? 'pending_payment' : 'confirmado'
    };
    const { data: insertedData, error } = await supabase.from("agendamentos").insert([appointmentData]).select('id').single();
    dismissToast(toastId);
    if (error || !insertedData) {
        showError(`Erro ao salvar agendamento: ${error?.message}`);
    } else {
        const message = `Olá! Seu agendamento para ${selectedService.name} no dia ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi ${requiresSinal ? 'pré-reservado e aguarda pagamento do sinal' : 'confirmado'}.`;
        if (currentClient?.phone) {
            supabase.functions.invoke('send-whatsapp', { body: { to: currentClient.phone, message } }).then(({ error: funcError }) => { if (funcError) console.error("Erro ao enviar notificação:", funcError.message); });
        }
        if (requiresSinal) {
            showSuccess("Agendamento pré-reservado! Redirecionando para pagamento...");
            const { data: funcData, error: funcError } = await supabase.functions.invoke('create-stripe-checkout', { body: { appointmentId: insertedData.id } });
            if (funcError || !funcData.checkoutUrl) {
                showError("Não foi possível criar o link de pagamento. Entre em contato com o suporte.");
                console.error(funcError);
            } else {
                window.location.href = funcData.checkoutUrl;
            }
        } else {
            showSuccess("Agendamento criado com sucesso!");
            form.reset();
            onSuccess();
        }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">1. Escolha o Serviço e Profissional</h3>
                <div className="space-y-4">
                    <FormField control={form.control} name="servico_id" render={({ field }) => (
                        <FormItem><FormLabel>Qual serviço você deseja?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger></FormControl><SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    {selectedService?.description && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border">
                            {selectedService.description}
                        </motion.div>
                    )}
                    <FormField control={form.control} name="barbeiro_id" render={({ field }) => (
                        <FormItem><FormLabel>Com qual profissional?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um barbeiro" /></SelectTrigger></FormControl><SelectContent>{sortedSedes.map((sede, index) => (<SelectGroup key={sede.id}><SelectLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />{sede.name}{sede.distance !== Infinity && (<span className="text-xs font-normal text-muted-foreground">({sede.distance.toFixed(1)} km){index === 0 && <span className="text-primary font-semibold ml-1">Mais próxima</span>}</span>)}</SelectLabel>{barbers.filter(b => b.sede_id === sede.id).map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectGroup>))}</SelectContent></Select>{field.value && (<Link to={`/barbeiro/${field.value}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"><User className="h-3 w-3" /> Ver perfil e portfólio</Link>)}<FormMessage /></FormItem>
                    )} />
                </div>
            </div>
            <Separator />
            <div>
                <h3 className="text-lg font-semibold mb-4">2. Selecione a Data e Horário</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Data</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="start_time" render={({ field }) => (
                        <FormItem><FormLabel>Horário</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={loadingSlots || (availableSlots.length === 0 && !loadingSlots)}><FormControl><SelectTrigger>{loadingSlots ? <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</div> : <SelectValue placeholder="Selecione um horário" />}</SelectTrigger></FormControl><SelectContent>{availableSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                {!loadingSlots && availableSlots.length === 0 && watchBarber && watchService && (
                    <div className="mt-4 text-center p-4 border rounded-lg bg-muted/50 space-y-3">
                        <p className="text-sm font-medium">Não há horários disponíveis para esta seleção.</p>
                        {isOnWaitlist ? (<p className="text-sm text-green-600 font-semibold">Você já está na lista de espera para este dia!</p>) : (<Button type="button" onClick={handleJoinWaitlist}><BellRing className="mr-2 h-4 w-4" />Me avise se vagar um horário</Button>)}
                    </div>
                )}
            </div>
        </div>
        {requiresSinal && (
            <Alert><Wallet className="h-4 w-4" /><AlertTitle>Sinal Necessário</AlertTitle><AlertDescription>Este serviço requer um sinal de <strong>R$ {selectedService?.sinal_value?.toFixed(2)}</strong>. O pagamento será solicitado após a confirmação.</AlertDescription></Alert>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting || availableSlots.length === 0} className="w-full" size="lg">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
        </Button>
      </form>
    </Form>
  );
};

export default AppointmentForm;