import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { FileText, FileDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Link } from "react-router-dom";
import { exportToCsv, exportToXlsx } from "@/utils/export";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Barber = {
  id: string;
  name: string;
  commission_percentage: number;
};

type ReportData = {
  id: string;
  start_time: string;
  cliente_name: string;
  servico_name: string;
  servico_price: number;
  commission_value: number;
};

const RelatoriosComissao = () => {
  const selectedSede = useSessionStore((state) => state.selectedSede);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchBarbers = async () => {
      if (!selectedSede) {
        setBarbers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("barbeiros")
        .select("id, name, commission_percentage")
        .eq("sede_id", selectedSede.id)
        .order("name");
      if (error) {
        showError("Erro ao buscar barbeiros.");
      } else {
        setBarbers(data as Barber[]);
      }
      setLoading(false);
    };
    fetchBarbers();
    setSelectedBarber(undefined);
    setReportData([]);
  }, [selectedSede]);

  const handleGenerateReport = async () => {
    if (!selectedBarber || !dateRange?.from || !dateRange?.to || !selectedSede) {
      showError("Por favor, selecione uma sede, um barbeiro e um período.");
      return;
    }
    setGenerating(true);
    setReportData([]);

    const barber = barbers.find(b => b.id === selectedBarber);
    if (!barber) {
        showError("Barbeiro não encontrado.");
        setGenerating(false);
        return;
    }

    const { data, error } = await supabase.rpc('get_commission_report', {
        p_barbeiro_id: selectedBarber,
        p_start_date: dateRange.from.toISOString(),
        p_end_date: dateRange.to.toISOString(),
    });

    if (error) {
      showError("Erro ao gerar relatório: " + error.message);
    } else {
      const commissionPercentage = barber.commission_percentage || 0;
      const formattedData = data.map(item => {
        const price = item.valor_servico || 0;
        return {
          id: item.id,
          start_time: item.data_atendimento,
          cliente_name: item.cliente_nome || "N/A",
          servico_name: item.servico_descricao || "N/A",
          servico_price: price,
          commission_value: price * (commissionPercentage / 100),
        };
      });
      setReportData(formattedData);
    }
    setGenerating(false);
  };

  const reportTotals = useMemo(() => {
    return reportData.reduce((acc, item) => {
        acc.totalRevenue += item.servico_price;
        acc.totalCommission += item.commission_value;
        return acc;
    }, { totalRevenue: 0, totalCommission: 0 });
  }, [reportData]);

  const handleExport = (formatType: 'csv' | 'xlsx') => {
    const barberName = barbers.find(b => b.id === selectedBarber)?.name || 'barbeiro';
    const baseFilename = `comissao-${barberName.replace(/\s+/g, '_')}-${format(new Date(), 'yyyy-MM-dd')}`;
    const headers = ["Data", "Cliente", "Serviço/Descrição", "Valor (R$)", "Comissão (R$)"];
    const dataToExport = reportData.map(item => ({
        data: format(new Date(item.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        cliente: item.cliente_name,
        servico: item.servico_name,
        valor: item.servico_price.toFixed(2),
        comissao: item.commission_value.toFixed(2),
    }));

    if (formatType === 'csv') {
        exportToCsv(`${baseFilename}.csv`, dataToExport, headers);
    } else {
        exportToXlsx(`${baseFilename}.xlsx`, dataToExport, headers);
    }
  };

  if (!selectedSede) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md"><CardHeader><CardTitle>Nenhuma Sede Selecionada</CardTitle><CardDescription>Para gerar relatórios de comissão, você precisa primeiro selecionar uma sede.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Use o seletor no menu lateral.</p></CardContent></Card>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Relatório de Comissões</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gerar Relatório para {selectedSede.name}</CardTitle>
            <CardDescription>Selecione um barbeiro e um período para ver o detalhamento das comissões.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-1 w-full">
              <label htmlFor="barber-select" className="text-sm font-medium">Barbeiro</label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger id="barber-select">
                  <SelectValue placeholder="Selecione um barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? <SelectItem value="loading" disabled>Carregando...</SelectItem> : barbers.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.commission_percentage || 0}%)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 flex-1 w-full">
                <label className="text-sm font-medium">Período</label>
                <DateRangeSelector date={dateRange} setDate={setDateRange} />
            </div>
            <Button onClick={handleGenerateReport} disabled={generating || !selectedBarber}>
              {generating ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </CardContent>
        </Card>

        {generating && <Skeleton className="h-96 w-full" />}

        {reportData.length > 0 && !generating && (
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle className="flex items-center gap-2"><FileText /> Detalhamento</CardTitle>
                      <CardDescription>
                          Relatório para <strong>{barbers.find(b => b.id === selectedBarber)?.name}</strong> no período selecionado.
                      </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport('csv')}>Exportar para .csv</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('xlsx')}>Exportar para .xlsx</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </CardHeader>
              <CardContent>
                  <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Serviço/Descrição</TableHead>
                                <TableHead className="text-right">Valor (R$)</TableHead>
                                <TableHead className="text-right">Comissão (R$)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{format(new Date(item.start_time), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                                    <TableCell>{item.cliente_name}</TableCell>
                                    <TableCell>{item.servico_name}</TableCell>
                                    <TableCell className="text-right">{item.servico_price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-green-600 dark:text-green-400">{item.commission_value.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold text-lg bg-muted/50">
                                <TableCell colSpan={3}>Total</TableCell>
                                <TableCell className="text-right">R$ {reportTotals.totalRevenue.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-green-600 dark:text-green-400">R$ {reportTotals.totalCommission.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                  </div>
              </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default RelatoriosComissao;