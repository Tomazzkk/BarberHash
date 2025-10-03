import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { DateRange } from "react-day-picker";

const COLORS = {
  concluido: '#22c55e', // green-500
  confirmado: '#3b82f6', // blue-500
  cancelado: '#ef4444', // red-500
};
const STATUS_NAMES = {
    concluido: 'Concluídos',
    confirmado: 'Confirmados',
    cancelado: 'Cancelados',
}

type StatusData = {
  name: string;
  value: number;
  color: string;
};

type AppointmentStatusChartProps = {
  dateRange: DateRange | undefined;
  sedeId: string | null;
};

const AppointmentStatusChart = ({ dateRange, sedeId }: AppointmentStatusChartProps) => {
  const [chartData, setChartData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      setLoading(true);
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();
      let query = supabase
        .from('agendamentos')
        .select('status')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);
      
      if (sedeId) {
        query = query.eq('sede_id', sedeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching appointment status:", error);
      } else {
        const statusCounts = data.reduce((acc, { status }) => {
          if (status) {
            acc[status] = (acc[status] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        const formattedData = Object.entries(statusCounts).map(([key, value]) => ({
            name: STATUS_NAMES[key as keyof typeof STATUS_NAMES],
            value,
            color: COLORS[key as keyof typeof COLORS]
        }));
        setChartData(formattedData);
      }
      setLoading(false);
    };
    fetchStatusData();
  }, [dateRange, sedeId]);

  if (loading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos por Status</CardTitle>
        <CardDescription>Dados do período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
              }}
            />
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={60} labelLine={false} paddingAngle={5}>
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-4 text-sm">
            {chartData.map(entry => (
                <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name} ({entry.value})</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentStatusChart;