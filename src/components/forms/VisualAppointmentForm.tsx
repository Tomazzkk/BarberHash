import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Star, Scissors, User, Wallet } from "lucide-react";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getAvatarUrl } from "@/utils/avatar";
import { Card, CardContent } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";

type Service = { id: string; name: string; price: number; duration_minutes: number; sinal_required?: boolean; sinal_value?: number; };
type Barber = { id: string; name: string; avatar_url: string | null; rating: number; };
type Client = { id: string; phone: string | null };

type VisualAppointmentFormProps = {
  onSuccess: () => void;
  prefillData?: { servico_id: string; barbeiro_id: string; } | null;
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const VisualAppointmentForm = ({ onSuccess, prefillData }: VisualAppointmentFormProps) => {
    const { user, profile, config } = useSessionStore();
    const [services, setServices] = useState<Service[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(prefillData?.barbeiro_id || null);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(prefillData?.servico_id || null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !config) return;
            setLoading(true);
            const [servicesRes, barbersRes, reviewsRes, clientRes] = await Promise.all([
                supabase.from("servicos").select("*").eq("user_id", config.user_id),
                supabase.from("barbeiros").select("id, name, avatar_url").eq("user_id", config.user_id),
                supabase.from('avaliacoes').select('barbeiro_id, rating').eq('user_id', config.user_id),
                supabase.from("clientes").select("id, phone").eq("email", user.email).single(),
            ]);

            const ratings: { [key: string]: { total: number, count: number } } = {};
            (reviewsRes.data || []).forEach(review => {
                if (review.barbeiro_id) {
                    if (!ratings[review.barbeiro_id]) ratings[review.barbeiro_id] = { total: 0, count: 0 };
                    ratings[review.barbeiro_id].total += review.rating;
                    ratings[review.barbeiro_id].count += 1;
                }
            });

            const barbersWithRatings = (barbersRes.data || []).map(barber => ({
                ...barber,
                rating: ratings[barber.id] ? ratings[barber.id].total / ratings[barber.id].count : 0
            }));

            setServices(servicesRes.data || []);
            setBarbers(barbersWithRatings);
            setClient(clientRes.data);
            setLoading(false);
        };
        fetchData();
    }, [user, config]);

    const { availableSlots, loadingSlots } = useAvailableSlots(selectedDate, selectedBarberId, selectedServiceId);

    useEffect(() => {
        setSelectedTime(null);
    }, [selectedDate, selectedBarberId, selectedServiceId]);

    const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);
    const requiresSinal = useMemo(() => config?.sinal_enabled && selectedService?.sinal_required && selectedService?.sinal_value, [config, selectedService]);

    const handleSubmit = async () => {
        if (!user || !profile || !config || !selectedServiceId || !selectedBarberId || !selectedDate || !selectedTime) {
            showError("Por favor, preencha todos os campos.");
            return;
        }
        let currentClient = client;
        if (!currentClient) {
            const { data: newClient } = await supabase.from('clientes').insert({ 
                name: profile.full_name || 'Nome não definido', 
                email: user.email,
                user_id: config.user_id
            }).select('id, phone').single();
            if (!newClient) { showError("Erro ao criar seu registro de cliente."); return; }
            currentClient = newClient;
        }
        const toastId = showLoading("Criando agendamento...");
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startTime = new Date(selectedDate);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(startTime.getTime() + selectedService!.duration_minutes * 60000);
        const appointmentData = {
            cliente_id: currentClient.id, servico_id: selectedServiceId, barbeiro_id: selectedBarberId,
            start_time: startTime.toISOString(), end_time: endTime.toISOString(), user_id: config.user_id,
            status: requiresSinal ? 'pending_payment' : 'confirmado'
        };
        const { data: insertedData, error } = await supabase.from("agendamentos").insert([appointmentData]).select('id').single();
        dismissToast(toastId);
        if (error || !insertedData) {
            showError(`Erro ao salvar agendamento: ${error?.message}`);
        } else {
            const message = `Olá! Seu agendamento para ${selectedService!.name} no dia ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} foi ${requiresSinal ? 'pré-reservado e aguarda pagamento do sinal' : 'confirmado'}.`;
            if (currentClient?.phone) {
                supabase.functions.invoke('send-whatsapp', { body: { to: currentClient.phone, message } });
            }
            if (requiresSinal) {
                showSuccess("Agendamento pré-reservado! Redirecionando para pagamento...");
                const { data: funcData, error: funcError } = await supabase.functions.invoke('create-stripe-checkout', { body: { appointmentId: insertedData.id } });
                if (funcError || !funcData.checkoutUrl) {
                    showError("Não foi possível criar o link de pagamento.");
                } else {
                    window.location.href = funcData.checkoutUrl;
                }
            } else {
                showSuccess("Agendamento criado com sucesso!");
                onSuccess();
            }
        }
    };

    if (loading) return <div className="space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;

    return (
        <div className="space-y-8">
            <Card><CardContent className="p-2"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="w-full" locale={ptBR} disabled={(date) => date < startOfDay(new Date())} /></CardContent></Card>
            
            <div>
                <h3 className="font-bold mb-2">Horários Disponíveis</h3>
                {loadingSlots ? <Skeleton className="h-24 w-full" /> : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">{availableSlots.map(slot => <Button key={slot} variant={selectedTime === slot ? "default" : "outline"} onClick={() => setSelectedTime(slot)}>{slot}</Button>)}</div>
                ) : <p className="text-sm text-center text-muted-foreground p-4 bg-muted rounded-md">Nenhum horário disponível. Tente outra data ou profissional.</p>}
            </div>

            <div>
                <h3 className="font-bold mb-2">Selecione o Profissional</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">{barbers.map(barber => (
                    <div key={barber.id} onClick={() => setSelectedBarberId(barber.id)} className={cn("p-3 border-2 rounded-lg text-center flex-shrink-0 w-32 cursor-pointer", selectedBarberId === barber.id ? "border-primary" : "border-transparent bg-muted")}>
                        <Avatar className="h-16 w-16 mx-auto"><AvatarImage src={getAvatarUrl(barber.name, barber.avatar_url)} /><AvatarFallback>{getInitials(barber.name)}</AvatarFallback></Avatar>
                        <p className="font-semibold mt-2 text-sm">{barber.name}</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 text-primary" /><span>{barber.rating.toFixed(1)}</span></div>
                    </div>
                ))}</div>
            </div>

            <div>
                <h3 className="font-bold mb-2">Selecione o Serviço</h3>
                <div className="space-y-2">{services.map(service => (
                    <div key={service.id} onClick={() => setSelectedServiceId(service.id)} className={cn("p-3 border-2 rounded-lg flex justify-between items-center cursor-pointer", selectedServiceId === service.id ? "border-primary" : "border-transparent bg-muted")}>
                        <p className="font-semibold">{service.name}</p><p className="text-muted-foreground">R$ {service.price.toFixed(2)}</p>
                    </div>
                ))}</div>
            </div>

            {requiresSinal && <Alert><Wallet className="h-4 w-4" /><AlertTitle>Sinal Necessário</AlertTitle><AlertDescription>Este serviço requer um sinal de <strong>R$ {selectedService?.sinal_value?.toFixed(2)}</strong>. O pagamento será solicitado após a confirmação.</AlertDescription></Alert>}

            <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!selectedDate || !selectedTime || !selectedBarberId || !selectedServiceId}>
                Agendar Agora
            </Button>
        </div>
    );
};

export default VisualAppointmentForm;