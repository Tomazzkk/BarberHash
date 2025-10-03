import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Clock, Star, Scissors, BetweenHorizontalStart, Droplets, Eye, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import NumberTicker from '@/components/magicui/number-ticker';

export type Service = { id: string; name: string; price: number; duration_minutes: number; description: string | null; };

type Step1ServicesProps = {
  onNext: (services: Service[]) => void;
  initialSelection?: Service[];
  sedeId: string;
};

const serviceDetails: { [key: string]: { icon: React.ElementType, rating: string } } = {
    'Corte Masculino': { icon: Scissors, rating: '4.9 (120 avaliações)' },
    'Barba Completa': { icon: BetweenHorizontalStart, rating: '4.8 (89 avaliações)' },
    'Lavagem + Hidratação': { icon: Droplets, rating: '4.7 (65 avaliações)' },
    'Sobrancelha': { icon: Eye, rating: '4.6 (43 avaliações)' },
    'Relaxamento': { icon: Smile, rating: '4.9 (78 avaliações)' },
    'Combo Cabelo & Barba': { icon: Star, rating: '5.0 (210 avaliações)' },
    'default': { icon: Scissors, rating: 'Novo' }
};

const getServiceDetails = (serviceName: string) => {
    const key = Object.keys(serviceDetails).find(k => serviceName.includes(k));
    return key ? serviceDetails[key] : serviceDetails.default;
};

const Step1Services = ({ onNext, initialSelection = [], sedeId }: Step1ServicesProps) => {
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<Service[]>(initialSelection);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            if (!sedeId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from("servicos")
                .select("id, name, price, duration_minutes, description")
                .eq('sede_id', sedeId);
            
            if (error) {
                console.error("Error fetching services:", error);
            } else {
                setServices(data || []);
            }
            setLoading(false);
        };
        fetchServices();
    }, [sedeId]);

    const handleSelectService = (service: Service) => {
        setSelectedServices(prev => 
            prev.find(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, service]
        );
    };

    const total = useMemo(() => selectedServices.reduce((acc, s) => acc + s.price, 0), [selectedServices]);

    return (
        <div className="pb-48">
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : services.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Nenhum serviço disponível nesta unidade.</p>
            ) : (
                <div className="space-y-4">
                    {services.map(service => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        const details = getServiceDetails(service.name);
                        const Icon = details.icon;
                        return (
                            <Card 
                                key={service.id} 
                                onClick={() => handleSelectService(service)}
                                className={cn(
                                    "cursor-pointer transition-all overflow-hidden", 
                                    isSelected ? "border-primary" : "border-border"
                                )}
                            >
                                <CardContent className="p-4 flex items-start gap-4">
                                    <div className="bg-black p-3 rounded-lg">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-foreground">{service.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-lg text-foreground whitespace-nowrap">R$ {service.price.toFixed(2)}</p>
                                                <div className="h-6 w-6 flex items-center justify-center">
                                                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {service.duration_minutes} min</span>
                                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {details.rating}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                {isSelected && (
                                    <div className="bg-primary text-primary-foreground text-sm font-semibold py-2 px-4 flex items-center gap-2">
                                        <Check className="h-4 w-4" />
                                        Selecionado
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {selectedServices.length > 0 && (
                    <motion.div
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-4 left-0 right-0 p-4"
                    >
                        <div className="max-w-2xl mx-auto bg-[#1C1C1C]/80 backdrop-blur-lg border border-primary text-white rounded-lg shadow-lg p-4 space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-bold text-base">Serviços selecionados</h3>
                                <div className="space-y-1">
                                    {selectedServices.map(service => (
                                        <div key={service.id} className="flex justify-between text-sm text-zinc-400">
                                            <span>{service.name}</span>
                                            <span>R$ {service.price.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <hr className="border-zinc-700" />
                            
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <div className="flex items-baseline">
                                    <span>R$ </span>
                                    <NumberTicker value={total} />
                                </div>
                            </div>

                            <div className="text-center">
                                <Button 
                                    size="lg" 
                                    onClick={() => onNext(selectedServices)} 
                                    className="bg-[#FFC72C] text-black hover:bg-[#FFC72C]/90 rounded-full font-bold px-12 h-11 text-sm w-full"
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Step1Services;