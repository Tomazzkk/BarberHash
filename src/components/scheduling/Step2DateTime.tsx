import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from './Step1Services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/utils/avatar';
import { cn } from '@/lib/utils';
import { ArrowRight, Star, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { useSchedulingSlots } from '@/hooks/useSchedulingSlots';

export type Barber = {
  id: string;
  name: string;
  avatar_url: string | null;
  sede_id: string;
  rating?: number;
};

type Sede = {
    id: string;
    name: string;
};

type Step2DateTimeProps = {
  selectedServices: Service[];
  onNext: (details: { barber: Barber; date: Date; time: string }) => void;
  onBack: () => void;
  sedeId: string;
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const Step2DateTime = ({ selectedServices, onNext, onBack, sedeId }: Step2DateTimeProps) => {
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [sede, setSede] = useState<Sede | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState<string | null>(null);

    const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0), [selectedServices]);
    const { availableSlots, loadingSlots } = useSchedulingSlots(date, selectedBarber?.id, totalDuration);

    useEffect(() => {
        const fetchData = async () => {
            if (!sedeId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            
            const [barbersRes, sedeRes] = await Promise.all([
                supabase.from("barbeiros").select("id, name, avatar_url, sede_id").eq('sede_id', sedeId),
                supabase.from("sedes").select("id, name").eq('id', sedeId).single()
            ]);

            if (barbersRes.error || sedeRes.error) {
                console.error("Error fetching data:", barbersRes.error || sedeRes.error);
            } else {
                setBarbers(barbersRes.data as Barber[] || []);
                setSede(sedeRes.data);
            }
            setLoading(false);
        };
        fetchData();
    }, [sedeId]);

    const handleNext = () => {
        if (!selectedBarber || !date || !time) return;
        onNext({ barber: selectedBarber, date, time });
    };

    if (loading) {
        return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-24 w-full" /></div>;
    }

    if (!selectedBarber) {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-xl font-bold">Escolha o Profissional em {sede?.name}</h2>
                {barbers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">Nenhum barbeiro disponível nesta unidade.</p>
                ) : (
                    <div className="space-y-3">
                        {barbers.map(barber => (
                            <Card key={barber.id} onClick={() => setSelectedBarber(barber)} className="cursor-pointer transition-all border-2 border-transparent hover:border-primary">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-16 w-16"><AvatarImage src={getAvatarUrl(barber.name, barber.avatar_url)} /><AvatarFallback>{getInitials(barber.name)}</AvatarFallback></Avatar>
                                    <div className="flex-1 space-y-1">
                                        <h3 className="font-bold">{barber.name}</h3>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-4 w-4 text-primary fill-primary" /> <span className="font-semibold text-foreground">Novo</span></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <Button variant="ghost" onClick={() => setSelectedBarber(null)} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Trocar Barbeiro
                </Button>
                <Card className="bg-muted/50 border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-16 w-16"><AvatarImage src={getAvatarUrl(selectedBarber.name, selectedBarber.avatar_url)} /><AvatarFallback>{getInitials(selectedBarber.name)}</AvatarFallback></Avatar>
                        <div>
                            <p className="text-sm text-muted-foreground">Você está agendando com</p>
                            <h3 className="font-bold text-lg">{selectedBarber.name}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div>
                <h2 className="text-xl font-bold mb-2">Escolha a Data</h2>
                <Card><CardContent className="p-0"><Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < startOfDay(new Date())} locale={ptBR} className="w-full" /></CardContent></Card>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-2">Escolha o Horário</h2>
                {loadingSlots ? <Skeleton className="h-24 w-full" /> : (
                    <div className="grid grid-cols-4 gap-2">
                        {availableSlots.length > 0 ? availableSlots.map(t => (
                            <Button key={t} variant={time === t ? "default" : "outline"} onClick={() => setTime(t)}>{t}</Button>
                        )) : <p className="col-span-4 text-center text-muted-foreground p-4 bg-muted rounded-md">Nenhum horário disponível para este dia.</p>}
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
                <div className="max-w-2xl mx-auto">
                    <Button size="lg" onClick={handleNext} disabled={!time} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-bold">
                        Continuar para Resumo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Step2DateTime;