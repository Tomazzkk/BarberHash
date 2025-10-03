import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar as CalendarIcon, Scissors, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "../ui/skeleton";

type NextAppointment = {
    id: string;
    start_time: string;
    servicos: { name: string } | null;
    barbeiros: { name: string } | null;
};

type NextAppointmentCardProps = {
    appointment: NextAppointment | null;
    loading: boolean;
};

const NextAppointmentCard = ({ appointment, loading }: NextAppointmentCardProps) => {
    if (loading) {
        return <Skeleton className="h-24 w-full bg-white/20" />;
    }

    if (!appointment) {
        return (
            <div className="flex items-center justify-between p-4 rounded-lg bg-black/30 backdrop-blur-sm">
                <p>Nenhum horário marcado. Que tal agendar seu próximo corte?</p>
                <Button asChild variant="secondary">
                    <Link to="/app/agendar">Agendar Agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-lg bg-black/30 backdrop-blur-sm">
            <div className="space-y-1">
                <p className="text-2xl font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6" />
                    {format(new Date(appointment.start_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-white/90 flex items-center gap-2">
                    <Scissors className="h-4 w-4" /> {appointment.servicos?.name || 'Serviço'}
                </p>
                <p className="text-white/90 flex items-center gap-2">
                    <User className="h-4 w-4" /> com {appointment.barbeiros?.name || 'Barbeiro'}
                </p>
            </div>
        </div>
    );
};

export default NextAppointmentCard;