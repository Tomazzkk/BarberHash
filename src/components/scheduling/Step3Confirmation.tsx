import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from '@/hooks/useSessionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Service } from './Step1Services';
import { Barber } from './Step2DateTime';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, CheckCircle, Loader2, Calendar, User, Scissors, DollarSign } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

type Step3ConfirmationProps = {
  details: {
    services: Service[];
    barber: Barber;
    date: Date;
    time: string;
  };
  onConfirm: (appointment: any) => void;
  onBack: () => void;
};

const Step3Confirmation = ({ details, onConfirm, onBack }: Step3ConfirmationProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, profile, config, loading: sessionLoading } = useSessionStore();

    const totalDuration = details.services.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalCost = details.services.reduce((sum, s) => sum + s.price, 0);

    const handleConfirm = async () => {
        if (sessionLoading) {
            showError("Aguarde, sua sessão está sendo carregada.");
            return;
        }
        if (!user || !profile || !config) {
            showError("Você precisa estar logado para agendar.");
            return;
        }
        setIsSubmitting(true);

        let { data: client } = await supabase.from('clientes').select('id').eq('email', user.email).single();
        if (!client) {
            const { data: newClient } = await supabase.from('clientes').insert({ name: profile.full_name || 'Nome não definido', email: user.email }).select('id').single();
            if (!newClient) {
                showError("Erro ao criar seu registro de cliente.");
                setIsSubmitting(false);
                return;
            }
            client = newClient;
        }

        const [hours, minutes] = details.time.split(':').map(Number);
        const startTime = new Date(details.date);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(startTime.getTime() + totalDuration * 60000);

        const appointmentData = {
            cliente_id: client.id,
            servico_id: details.services[0].id, // Simplified for now, can be improved for multiple services
            barbeiro_id: details.barber.id,
            sede_id: details.barber.sede_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            user_id: config.user_id,
            status: 'confirmado'
        };

        const { data: newAppointment, error } = await supabase.from("agendamentos").insert(appointmentData).select().single();

        if (error) {
            showError(`Erro ao agendar: ${error.message}`);
        } else {
            showSuccess("Agendamento confirmado!");
            onConfirm({ ...details, totalCost });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-bold">Confirme seu agendamento</h2>
            <Card>
                <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><div><p className="font-semibold">{format(details.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p><p className="text-muted-foreground">às {details.time}</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-primary" /><div><p className="font-semibold">{details.barber.name}</p><p className="text-muted-foreground">Profissional</p></div></div>
                    <div className="flex items-start gap-3"><Scissors className="h-5 w-5 text-primary mt-1" /><div><p className="font-semibold">Serviços</p><ul className="list-disc pl-5 text-muted-foreground">{details.services.map(s => <li key={s.id}>{s.name}</li>)}</ul></div></div>
                    <div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-primary" /><div><p className="font-semibold">R$ {totalCost.toFixed(2)}</p><p className="text-muted-foreground">Valor Total</p></div></div>
                </CardContent>
            </Card>
            <div className="fixed bottom-16 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                    <Button size="lg" onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Step3Confirmation;