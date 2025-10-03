import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { DateRange } from "react-day-picker";
import { getAvatarUrl } from "@/utils/avatar";

type BarberStats = {
  id: string;
  name: string;
  avatar_url: string | null;
  appointmentsCount: number;
};

type TopBarbersCardProps = {
  dateRange: DateRange | undefined;
  sedeId: string | null;
};

const TopBarbersCard = ({ dateRange, sedeId }: TopBarbersCardProps) => {
  const [topBarbers, setTopBarbers] = useState<BarberStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopBarbers = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      setLoading(true);
      
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();

      let aptQuery = supabase
        .from("agendamentos")
        .select("barbeiro_id")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);
      if (sedeId) aptQuery = aptQuery.eq("sede_id", sedeId);
      const { data: appointments, error: aptError } = await aptQuery;

      if (aptError) {
        console.error("Error fetching appointments for stats:", aptError);
        setLoading(false);
        return;
      }

      let barberQuery = supabase.from("barbeiros").select("id, name, avatar_url");
      if (sedeId) barberQuery = barberQuery.eq("sede_id", sedeId);
      const { data: barbers, error: barberError } = await barberQuery;

      if (barberError) {
        console.error("Error fetching barbers:", barberError);
        setLoading(false);
        return;
      }

      const appointmentCounts = appointments.reduce((acc, apt) => {
        if (apt.barbeiro_id) {
          acc[apt.barbeiro_id] = (acc[apt.barbeiro_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const stats: BarberStats[] = barbers.map(barber => ({
        id: barber.id,
        name: barber.name,
        avatar_url: barber.avatar_url,
        appointmentsCount: appointmentCounts[barber.id] || 0,
      }));

      stats.sort((a, b) => b.appointmentsCount - a.appointmentsCount);

      setTopBarbers(stats.slice(0, 5));
      setLoading(false);
    };

    fetchTopBarbers();
  }, [dateRange, sedeId]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Barbeiros em Destaque</CardTitle>
                <CardDescription>Top 5 por agendamentos no período.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Skeleton className="h-5 w-12" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barbeiros em Destaque</CardTitle>
        <CardDescription>Top 5 por agendamentos no período.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {topBarbers.length > 0 ? topBarbers.map((barber) => (
          <div key={barber.id} className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex">
              <AvatarImage src={getAvatarUrl(barber.name, barber.avatar_url)} alt={barber.name} />
              <AvatarFallback>{getInitials(barber.name)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 flex-1">
              <p className="text-sm font-medium leading-none">{barber.name}</p>
            </div>
            <div className="ml-auto font-medium">{barber.appointmentsCount} cortes</div>
          </div>
        )) : (
            <p className="text-sm text-center text-muted-foreground pt-4">Sem dados de performance no período.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopBarbersCard;