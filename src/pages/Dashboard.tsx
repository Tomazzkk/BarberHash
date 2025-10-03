import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, Activity, Calendar as CalendarIcon } from "lucide-react";
import StatCard from "@/components/StatCard";
import RecentAppointmentsCard from "@/components/dashboard/RecentAppointmentsCard";
import TopBarbersCard from "@/components/dashboard/TopBarbersCard";
import AppointmentStatusChart from "@/components/dashboard/AppointmentStatusChart";
import RevenueByServiceChart from "@/components/dashboard/RevenueByServiceChart";
import { DateRange } from "react-day-picker";
import { useSessionStore } from "@/hooks/useSessionStore";
import RevenueProjectionCard from "@/components/dashboard/RevenueProjectionCard";
import OnboardingProgress from "@/components/dashboard/OnboardingProgress";
import { DateRangeSelector } from "@/components/DateRangeSelector";

type FinancialEntry = {
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string;
};

const Dashboard = () => {
  const { profile, barberId: loggedInBarberId, selectedSede } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [chartData, setChartData] = useState<{ name: string; Faturamento: number }[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();
      const isBarber = profile?.role === 'barbeiro' && loggedInBarberId;

      // Fetch financial data
      let financialEntries: FinancialEntry[] = [];
      if (isBarber) {
        const { data: aptData } = await supabase
          .from('agendamentos')
          .select('servicos!inner(price), created_at')
          .eq('status', 'concluido')
          .eq('barbeiro_id', loggedInBarberId)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);
        if (aptData) {
          financialEntries = aptData.map(apt => ({
            valor: (apt.servicos as any).price,
            tipo: 'entrada',
            data: apt.created_at,
          }));
        }
      } else {
        let financialQuery = supabase.from('financeiro').select('valor, tipo, data').gte('data', fromDate).lte('data', toDate);
        if (selectedSede) {
            financialQuery = financialQuery.eq('sede_id', selectedSede.id);
        }
        const { data } = await financialQuery;
        if (data) financialEntries = data;
      }
      const revenue = financialEntries.reduce((acc, entry) => (entry.tipo === 'entrada' ? acc + entry.valor : acc), 0);
      setTotalRevenue(revenue);
      setChartData(processChartData(financialEntries, dateRange));

      // Fetch appointment count
      let appointmentQuery = supabase.from('agendamentos').select('id', { count: 'exact' }).gte('created_at', fromDate).lte('created_at', toDate);
      if (selectedSede) appointmentQuery = appointmentQuery.eq('sede_id', selectedSede.id);
      if (isBarber) appointmentQuery = appointmentQuery.eq('barbeiro_id', loggedInBarberId);
      const appointmentRes = await appointmentQuery;
      setTotalAppointments(appointmentRes.count || 0);

      // Fetch new clients (only for owners/admins)
      if (!isBarber) {
        let clientQuery = supabase.from('clientes').select('id', { count: 'exact' }).gte('created_at', fromDate).lte('created_at', toDate);
        if (selectedSede) clientQuery = clientQuery.eq('sede_id', selectedSede.id);
        const clientRes = await clientQuery;
        setNewClients(clientRes.count || 0);
      }

      setLoading(false);
    };

    fetchData();
  }, [dateRange, profile, loggedInBarberId, selectedSede]);

  const processChartData = (data: FinancialEntry[], range: DateRange) => {
    if (!range.from || !range.to) return [];
    const dateInterval = eachDayOfInterval({ start: range.from, end: range.to });

    const dailyRevenueMap = new Map<string, number>();
    dateInterval.forEach(date => {
      dailyRevenueMap.set(format(date, 'dd/MM'), 0);
    });

    data.forEach(entry => {
      if (entry.tipo === 'entrada') {
        const entryDateKey = format(startOfDay(new Date(entry.data)), 'dd/MM');
        if (dailyRevenueMap.has(entryDateKey)) {
          dailyRevenueMap.set(entryDateKey, (dailyRevenueMap.get(entryDateKey) || 0) + entry.valor);
        }
      }
    });
    
    return Array.from(dailyRevenueMap, ([name, Faturamento]) => ({ name, Faturamento }));
  };

  const dateRangeDescription = dateRange?.from && dateRange.to ? 
    `De ${format(dateRange.from, "dd/MM/y")} a ${format(dateRange.to, "dd/MM/y")}` :
    "Período selecionado";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" /> <Skeleton className="h-32" /> <Skeleton className="h-32" /> <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="h-96 col-span-4" /> <Skeleton className="h-96 col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-lg font-semibold md:text-2xl">Dashboard: {selectedSede?.name || "Todas as Sedes"}</h1>
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
        </div>
      
      {profile?.role === 'dono' && <OnboardingProgress />}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={profile?.role === 'barbeiro' ? "Minha Receita" : "Faturamento Total"}
          value={`R$ ${totalRevenue.toFixed(2)}`}
          description={dateRangeDescription}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard 
          title={profile?.role === 'barbeiro' ? "Meus Atendimentos" : "Agendamentos"}
          value={`+${totalAppointments}`}
          description={dateRangeDescription}
          icon={<CalendarIcon className="h-4 w-4" />}
        />
        {profile?.role !== 'barbeiro' && (
            <>
                <StatCard 
                    title="Novos Clientes"
                    value={`+${newClients}`}
                    description={dateRangeDescription}
                    icon={<Users className="h-4 w-4" />}
                />
                <RevenueProjectionCard sedeId={selectedSede?.id || null} />
            </>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
            <CardTitle>Visão Geral do Faturamento</CardTitle>
            <CardDescription>Faturamento de entradas para o período selecionado.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip formatter={(value: number) => [`R$${value.toFixed(2)}`, 'Faturamento']} />
                <Line type="monotone" dataKey="Faturamento" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-4">
            <RecentAppointmentsCard dateRange={dateRange} barberId={profile?.role === 'barbeiro' ? loggedInBarberId : null} sedeId={selectedSede?.id || null} />
            {profile?.role !== 'barbeiro' && <TopBarbersCard dateRange={dateRange} sedeId={selectedSede?.id || null} />}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
            <AppointmentStatusChart dateRange={dateRange} sedeId={selectedSede?.id || null} />
        </div>
        <div className="lg:col-span-3">
            <RevenueByServiceChart dateRange={dateRange} sedeId={selectedSede?.id || null} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;