import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { DateRange } from "react-day-picker";

type RevenueData = {
  name: string;
  total: number;
};

type RevenueByServiceChartProps = {
  dateRange: DateRange | undefined;
  sedeId: string | null;
};

const RevenueByServiceChart = ({ dateRange, sedeId }: RevenueByServiceChartProps) => {
  const [chartData, setChartData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      setLoading(true);
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();
      let query = supabase
        .from('agendamentos')
        .select('servicos!inner(name, price)')
        .eq('status', 'concluido')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (sedeId) {
        query = query.eq('sede_id', sedeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching revenue by service:", error);
      } else {
        const revenueByService = data.reduce((acc, apt) => {
          const service = apt.servicos as unknown as { name: string; price: number } | null;
          const serviceName = service?.name;
          const servicePrice = service?.price;
          if (serviceName && servicePrice) {
            acc[serviceName] = (acc[serviceName] || 0) + servicePrice;
          }
          return acc;
        }, {} as Record<string, number>);

        const formattedData = Object.entries(revenueByService)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5); // Top 5 services

        setChartData(formattedData);
      }
      setLoading(false);
    };
    fetchRevenueData();
  }, [dateRange, sedeId]);

  if (loading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Serviços por Receita</CardTitle>
        <CardDescription>Dados do período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              formatter={(value: number) => [`R$${value.toFixed(2)}`, 'Receita']}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
              }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueByServiceChart;