import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, getDaysInMonth } from "date-fns";

type RevenueProjectionCardProps = {
  sedeId: string | null;
};

const RevenueProjectionCard = ({ sedeId }: RevenueProjectionCardProps) => {
  const [loading, setLoading] = useState(true);
  const [projection, setProjection] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);

  useEffect(() => {
    const fetchProjectionData = async () => {
      setLoading(true);
      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today);
      const endOfCurrentMonth = endOfMonth(today);
      const startOfPreviousMonth = startOfMonth(subMonths(today, 1));
      const endOfPreviousMonth = endOfMonth(subMonths(today, 1));

      // Fetch current month's revenue
      let currentMonthQuery = supabase
        .from("financeiro")
        .select("valor")
        .eq("tipo", "entrada")
        .gte("data", startOfCurrentMonth.toISOString())
        .lte("data", endOfCurrentMonth.toISOString());
      if (sedeId) currentMonthQuery = currentMonthQuery.eq("sede_id", sedeId);
      const { data: currentMonthData } = await currentMonthQuery;
      const currentRevenue = currentMonthData?.reduce((sum, entry) => sum + entry.valor, 0) || 0;

      // Fetch previous month's revenue
      let previousMonthQuery = supabase
        .from("financeiro")
        .select("valor")
        .eq("tipo", "entrada")
        .gte("data", startOfPreviousMonth.toISOString())
        .lte("data", endOfPreviousMonth.toISOString());
      if (sedeId) previousMonthQuery = previousMonthQuery.eq("sede_id", sedeId);
      const { data: previousMonthData } = await previousMonthQuery;
      const previousMonthRevenue = previousMonthData?.reduce((sum, entry) => sum + entry.valor, 0) || 0;

      // Calculate projection
      const daysInMonth = getDaysInMonth(today);
      const currentDayOfMonth = today.getDate();
      const dailyAverage = currentRevenue / currentDayOfMonth;
      const projectedRevenue = dailyAverage * daysInMonth;
      setProjection(projectedRevenue);

      // Calculate percentage change
      if (previousMonthRevenue > 0) {
        const change = ((projectedRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
        setPercentageChange(change);
      } else {
        setPercentageChange(projectedRevenue > 0 ? 100 : 0);
      }

      setLoading(false);
    };

    fetchProjectionData();
  }, [sedeId]);

  const ChangeIndicator = () => {
    if (percentageChange > 0) {
      return <><TrendingUp className="h-4 w-4 text-green-500" /> <span className="text-green-500">+{percentageChange.toFixed(1)}%</span></>;
    }
    if (percentageChange < 0) {
      return <><TrendingDown className="h-4 w-4 text-red-500" /> <span className="text-red-500">{percentageChange.toFixed(1)}%</span></>;
    }
    return <><Minus className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">0.0%</span></>;
  };

  if (loading) {
    return <Skeleton className="h-32" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Projeção de Faturamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">R$ {projection.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ChangeIndicator /> em relação ao mês anterior
        </p>
      </CardContent>
    </Card>
  );
};

export default RevenueProjectionCard;