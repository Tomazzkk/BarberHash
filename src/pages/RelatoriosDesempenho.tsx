import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { FileDown, TrendingUp, Scissors, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Link } from "react-router-dom";
import { exportToCsv } from "@/utils/export";
import StatCard from "@/components/StatCard";
import { DateRangeSelector } from "@/components/DateRangeSelector";

type BarberPerformanceData = {
  barberId: string;
  barberName: string;
  totalRevenue: number;
  totalAppointments: number;
  averageTicket: number;
};

const RelatoriosDesempenho = () => {
  const selectedSede = useSessionStore((state) => state.selectedSede);
  const [performanceData, setPerformanceData] = useState<BarberPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const fetchPerformanceData = useCallback(async () => {
    if (!selectedSede || !dateRange?.from || !dateRange?.to) {
      setPerformanceData([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("agendamentos")
      .select("barbeiros!inner(id, name), servicos!inner(price)")
      .eq("sede_id", selectedSede.id)
      .eq("status", "concluido")
      .gte("start_time", dateRange.from.toISOString())
      .lte("start_time", dateRange.to.toISOString());

    if (error) {
      showError("Erro ao buscar dados de desempenho: " + error.message);
      setPerformanceData([]);
    } else {
      const performanceMap = new Map<string, { name: string; revenue: number; count: number }>();
      
      data.forEach(apt => {
        const barber = apt.barbeiros as unknown as { id: string; name: string };
        const service = apt.servicos as unknown as { price: number };
        if (!barber || !service) return;

        const current = performanceMap.get(barber.id) || { name: barber.name, revenue: 0, count: 0 };
        current.revenue += service.price;
        current.count += 1;
        performanceMap.set(barber.id, current);
      });

      const formattedData = Array.from(performanceMap.entries()).map(([id, stats]) => ({
        barberId: id,
        barberName: stats.name,
        totalRevenue: stats.revenue,
        totalAppointments: stats.count,
        averageTicket: stats.count > 0 ? stats.revenue / stats.count : 0,
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);

      setPerformanceData(formattedData);
    }
    setLoading(false);
  }, [selectedSede, dateRange]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const overallStats = useMemo(() => {
    return performanceData.reduce((acc, barber) => {
        acc.totalRevenue += barber.totalRevenue;
        acc.totalAppointments += barber.totalAppointments;
        return acc;
    }, { totalRevenue: 0, totalAppointments: 0 });
  }, [performanceData]);

  const handleExport = () => {
    const dataToExport = performanceData.map(item => ({
        barbeiro: item.barberName,
        faturamento: item.totalRevenue.toFixed(2).replace('.', ','),
        atendimentos: item.totalAppointments,
        ticket_medio: item.averageTicket.toFixed(2).replace('.', ','),
    }));
    const headers = ["Barbeiro", "Faturamento Total (R$)", "Nº de Atendimentos", "Ticket Médio (R$)"];
    exportToCsv(`desempenho-${selectedSede?.name.replace(' ', '_')}-${format(new Date(), 'yyyy-MM-dd')}.csv`, dataToExport, headers);
  };

  if (!selectedSede) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md"><CardHeader><CardTitle>Nenhuma Sede Selecionada</CardTitle><CardDescription>Para ver relatórios de desempenho, você precisa primeiro selecionar uma sede.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Use o seletor no menu lateral.</p></CardContent></Card>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Desempenho da Equipe</h1>
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading ? <><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></> : <>
              <StatCard title="Faturamento da Equipe" value={`R$ ${overallStats.totalRevenue.toFixed(2)}`} icon={<TrendingUp />} />
              <StatCard title="Atendimentos Totais" value={overallStats.totalAppointments.toString()} icon={<Scissors />} />
              <StatCard title="Ticket Médio Geral" value={`R$ ${(overallStats.totalAppointments > 0 ? overallStats.totalRevenue / overallStats.totalAppointments : 0).toFixed(2)}`} icon={<DollarSign />} />
          </>}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Desempenho por Barbeiro</CardTitle><CardDescription>Análise de faturamento e atendimentos para {selectedSede.name}.</CardDescription></div>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={performanceData.length === 0}><FileDown className="mr-2 h-4 w-4" />Exportar CSV</Button>
          </CardHeader>
          <CardContent>
              {loading ? <Skeleton className="h-64 w-full" /> : performanceData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-16">Nenhum atendimento concluído no período selecionado.</p>
              ) : (
                  <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>Barbeiro</TableHead><TableHead className="text-right">Faturamento</TableHead><TableHead className="text-right">Atendimentos</TableHead><TableHead className="text-right">Ticket Médio</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {performanceData.map(item => (
                                <TableRow key={item.barberId}>
                                    <TableCell className="font-medium">{item.barberName}</TableCell>
                                    <TableCell className="text-right">R$ {item.totalRevenue.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{item.totalAppointments}</TableCell>
                                    <TableCell className="text-right font-semibold">R$ {item.averageTicket.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter><TableRow className="font-bold text-lg bg-muted/50"><TableCell>Total da Equipe</TableCell><TableCell className="text-right">R$ {overallStats.totalRevenue.toFixed(2)}</TableCell><TableCell className="text-right">{overallStats.totalAppointments}</TableCell><TableCell className="text-right">R$ {(overallStats.totalAppointments > 0 ? overallStats.totalRevenue / overallStats.totalAppointments : 0).toFixed(2)}</TableCell></TableRow></TableFooter>
                    </Table>
                  </div>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RelatoriosDesempenho;