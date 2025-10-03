import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crown, UserX, Medal, UserCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSessionStore } from "@/hooks/useSessionStore";
import { DateRange } from "react-day-picker";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DateRangeSelector } from "@/components/DateRangeSelector";

type TopClient = {
  name: string;
  totalSpent: number;
};

type InactiveClient = {
  name: string;
  created_at: string;
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
const COLORS = ['#3b82f6', '#16a34a']; // blue-500, green-600

const RelatoriosClientes = () => {
  const selectedSede = useSessionStore((state) => state.selectedSede);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [inactiveClients, setInactiveClients] = useState<InactiveClient[]>([]);
  const [clientStats, setClientStats] = useState({ new: 0, recurrent: 0 });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const fetchData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    setLoading(true);
    try {
      // Fetch Top Clients for the selected date range
      let aptQuery = supabase
        .from("agendamentos")
        .select("clientes!inner(name), servicos!inner(price)")
        .eq("status", "concluido")
        .gte("start_time", dateRange.from.toISOString())
        .lte("start_time", dateRange.to.toISOString());
      if (selectedSede) aptQuery = aptQuery.eq("sede_id", selectedSede.id);
      const { data: completedAppointments, error: aptError } = await aptQuery;
      if (aptError) throw aptError;

      const clientSpending = completedAppointments.reduce((acc, apt) => {
        const clientName = (apt.clientes as any)?.name;
        const servicePrice = (apt.servicos as any)?.price;
        if (clientName && servicePrice) {
          acc[clientName] = (acc[clientName] || 0) + servicePrice;
        }
        return acc;
      }, {} as Record<string, number>);
      const sortedClients = Object.entries(clientSpending).map(([name, totalSpent]) => ({ name, totalSpent })).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
      setTopClients(sortedClients);

      // Fetch New vs Recurrent Clients
      const uniqueClientIdsInPeriod = [...new Set(completedAppointments.map(a => (a.clientes as any)?.id).filter(Boolean))];
      if (uniqueClientIdsInPeriod.length > 0) {
        const { data: recurrentClientsData, error: recurrentError } = await supabase.from('agendamentos').select('cliente_id').in('cliente_id', uniqueClientIdsInPeriod).lt('start_time', dateRange.from.toISOString());
        if (recurrentError) throw recurrentError;
        const recurrentClientIds = new Set(recurrentClientsData.map(a => a.cliente_id));
        setClientStats({ new: uniqueClientIdsInPeriod.length - recurrentClientIds.size, recurrent: recurrentClientIds.size });
      } else {
        setClientStats({ new: 0, recurrent: 0 });
      }

      // Fetch Inactive Clients (logic remains last 90 days, independent of date range)
      const cutoffDate = subDays(new Date(), 90).toISOString();
      let activeClientsQuery = supabase.from('agendamentos').select('cliente_id').gte('start_time', cutoffDate);
      if (selectedSede) activeClientsQuery = activeClientsQuery.eq("sede_id", selectedSede.id);
      const { data: activeClientsData, error: activeError } = await activeClientsQuery;
      if (activeError) throw activeError;
      const activeClientIds = new Set(activeClientsData.map(a => a.cliente_id));
      let allClientsQuery = supabase.from('clientes').select('id, name, created_at');
      if (selectedSede) allClientsQuery = allClientsQuery.eq("sede_id", selectedSede.id);
      const { data: allClientsData, error: allClientsError } = await allClientsQuery;
      if (allClientsError) throw allClientsError;
      const inactive = allClientsData.filter(c => !activeClientIds.has(c.id));
      setInactiveClients(inactive);

    } catch (error: any) {
      showError("Erro ao buscar dados para relatórios: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSede, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clientTypeData = [
    { name: 'Novos', value: clientStats.new },
    { name: 'Recorrentes', value: clientStats.recurrent },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Relatórios de Clientes</h1>
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Crown className="text-amber-500" /> Top 10 Clientes</CardTitle><CardDescription>Clientes que mais geraram faturamento no período selecionado.</CardDescription></CardHeader>
            <CardContent>{loading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : topClients.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum dado de faturamento encontrado.</p> : <ul className="space-y-4">{topClients.map((client, index) => <li key={client.name} className="flex items-center gap-4"><Medal className={`h-6 w-6 ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-muted-foreground'}`} /><Avatar><AvatarFallback>{getInitials(client.name)}</AvatarFallback></Avatar><div className="flex-1"><p className="font-medium">{client.name}</p></div><p className="font-semibold text-green-600 dark:text-green-400">R$ {client.totalSpent.toFixed(2)}</p></li>)}</ul>}</CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users /> Novos vs. Recorrentes</CardTitle><CardDescription>Clientes que agendaram no período.</CardDescription></CardHeader>
            <CardContent>{loading ? <Skeleton className="h-56 w-full" /> : (clientStats.new + clientStats.recurrent === 0) ? <p className="text-center text-muted-foreground py-8">Sem dados de agendamentos.</p> : <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={clientTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}>{clientTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>}</CardContent>
          </Card>
          <Card className="lg:col-span-3"><CardHeader><CardTitle className="flex items-center gap-2"><UserX className="text-red-500" /> Clientes Inativos</CardTitle><CardDescription>Clientes sem agendamentos nos últimos 90 dias.</CardDescription></CardHeader>
            <CardContent>{loading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : inactiveClients.length === 0 ? <p className="text-center text-muted-foreground py-8 flex items-center justify-center gap-2"><UserCheck /> Todos os clientes estão ativos!</p> : <ul className="space-y-4 max-h-96 overflow-y-auto">{inactiveClients.map((client) => <li key={client.name} className="flex items-center gap-4"><Avatar><AvatarFallback>{getInitials(client.name)}</AvatarFallback></Avatar><div className="flex-1"><p className="font-medium">{client.name}</p><p className="text-xs text-muted-foreground">Cliente desde: {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}</p></div></li>)}</ul>}</CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RelatoriosClientes;