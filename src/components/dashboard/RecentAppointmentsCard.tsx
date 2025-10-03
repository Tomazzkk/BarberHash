import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { getAvatarUrl } from "@/utils/avatar";

type RecentAppointment = {
  id: string;
  clientes: { name: string } | null;
  servicos: { price: number } | null;
};

type RecentAppointmentsCardProps = {
  dateRange: DateRange | undefined;
  barberId?: string | null;
  sedeId: string | null;
};

const RecentAppointmentsCard = ({ dateRange, barberId, sedeId }: RecentAppointmentsCardProps) => {
  const [appointments, setAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      setLoading(true);
      let query = supabase
        .from("agendamentos")
        .select("id, clientes!inner(name), servicos!inner(price)")
        .gte("start_time", dateRange.from.toISOString())
        .lte("start_time", dateRange.to.toISOString())
        .order("start_time", { ascending: false })
        .limit(5);

      if (sedeId) {
        query = query.eq("sede_id", sedeId);
      }
      if (barberId) {
        query = query.eq('barbeiro_id', barberId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching recent appointments:", error);
        setAppointments([]);
      } else {
        setAppointments(data as unknown as RecentAppointment[]);
      }
      setLoading(false);
    };

    fetchRecentAppointments();
  }, [dateRange, barberId, sedeId]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Agendamentos Recentes</CardTitle>
                <CardDescription>Os últimos agendamentos no período.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
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
        <CardTitle>Agendamentos Recentes</CardTitle>
        <CardDescription>Os últimos agendamentos realizados no período.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {appointments.length > 0 ? appointments.map((apt) => (
          <div key={apt.id} className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex">
              <AvatarImage src={getAvatarUrl(apt.clientes?.name)} alt="Avatar" />
              <AvatarFallback>{getInitials(apt.clientes?.name || '??')}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 flex-1">
              <p className="text-sm font-medium leading-none">{apt.clientes?.name || "Cliente anônimo"}</p>
              <p className="text-sm text-muted-foreground">{apt.clientes?.name?.toLowerCase().replace(' ', '.') + "@exemplo.com"}</p>
            </div>
            <div className="ml-auto font-medium">+R${apt.servicos?.price?.toFixed(2) || '0.00'}</div>
          </div>
        )) : (
            <p className="text-sm text-center text-muted-foreground pt-4">Nenhum agendamento recente no período.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentAppointmentsCard;