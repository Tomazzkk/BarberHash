import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import FinancialEntryForm, { FinancialEntry } from "@/components/forms/FinancialEntryForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, ArrowUpCircle, ArrowDownCircle, User, Scissors, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Link } from "react-router-dom";
import { exportToCsv } from "@/utils/export";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type DetailedFinancialEntry = FinancialEntry & {
  barbeiro_id: string | null;
  agendamentos: {
    barbeiro_id: string | null;
    barbeiros: { name: string } | null;
    servicos: { name: string } | null;
  } | null;
};

type Barber = {
  id: string;
  name: string;
  commission_percentage: number | null;
};

const fetchFinancialEntries = async (sedeId: string | null, range: DateRange | undefined) => {
    if (!range?.from || !range?.to || !sedeId) {
        return [];
    }
    const { data, error } = await supabase
      .from("financeiro")
      .select("*, agendamentos!left(barbeiro_id, barbeiros(name), servicos(name))")
      .eq("sede_id", sedeId)
      .gte("data", range.from.toISOString())
      .lte("data", range.to.toISOString())
      .order("data", { ascending: false });
    
    if (error) throw error;
    return data as DetailedFinancialEntry[];
};

const Financeiro = () => {
  const { selectedSede } = useSessionStore();
  const queryClient = useQueryClient();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const queryKey = ['financial_entries', selectedSede?.id, dateRange];

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchFinancialEntries(selectedSede?.id || null, dateRange),
    enabled: !!selectedSede,
  });

  useEffect(() => {
    const fetchBarbers = async () => {
      if (!selectedSede) {
        setBarbers([]);
        return;
      }
      const { data, error } = await supabase.from("barbeiros").select("id, name, commission_percentage").eq("sede_id", selectedSede.id);
      if (error) showError("Erro ao buscar dados dos barbeiros.");
      else setBarbers(data as Barber[] || []);
    };
    fetchBarbers();
  }, [selectedSede]);

  const { totalEntradas, totalSaidas, saldo, revenueByBarber, revenueByService } = useMemo(() => {
    const barbersMap = new Map(barbers.map(b => [b.id, { name: b.name, commission_percentage: b.commission_percentage || 0 }]));
    const initial = { 
      totalEntradas: 0, 
      totalSaidas: 0, 
      byBarber: new Map<string, { total: number; commission: number }>(), 
      byService: new Map<string, number>() 
    };
    
    const totals = entries.reduce((acc, entry) => {
      if (entry.tipo === 'entrada') {
        acc.totalEntradas += entry.valor;
        
        let barberId: string | null = null;
        let barberName: string | null = null;
        let serviceName: string | null = null;

        if (entry.agendamentos) {
          barberId = entry.agendamentos.barbeiro_id;
          barberName = entry.agendamentos.barbeiros?.name || null;
          serviceName = entry.agendamentos.servicos?.name || null;
        } else {
          barberId = entry.barbeiro_id;
          if (barberId) {
            barberName = barbersMap.get(barberId)?.name || null;
          }
        }

        if (barberId && barberName) {
          const currentData = acc.byBarber.get(barberName) || { total: 0, commission: 0 };
          const commissionPercentage = barbersMap.get(barberId)?.commission_percentage || 0;
          currentData.total += entry.valor;
          currentData.commission += entry.valor * (commissionPercentage / 100);
          acc.byBarber.set(barberName, currentData);
        }
        
        if (serviceName) {
            acc.byService.set(serviceName, (acc.byService.get(serviceName) || 0) + entry.valor);
        }

      } else {
        acc.totalSaidas += entry.valor;
      }
      return acc;
    }, initial);

    return {
      totalEntradas: totals.totalEntradas,
      totalSaidas: totals.totalSaidas,
      saldo: totals.totalEntradas - totals.totalSaidas,
      revenueByBarber: Array.from(totals.byBarber.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total),
      revenueByService: Array.from(totals.byService.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total),
    };
  }, [entries, barbers]);

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
        const { error } = await supabase.from("financeiro").delete().eq("id", entryId);
        if (error) throw error;
    },
    onSuccess: () => {
        showSuccess("Lançamento excluído com sucesso!");
        queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onError: (error: any) => {
        showError("Erro ao excluir lançamento: " + error.message);
    }
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedEntry(null);
  };

  const handleEdit = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEntry(null);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const dataToExport = entries.map(entry => ({
        data: format(new Date(entry.data), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        descricao: entry.descricao,
        tipo: entry.tipo === 'entrada' ? 'Entrada' : 'Saída',
        valor: entry.valor.toFixed(2).replace('.', ','),
        barbeiro: entry.agendamentos?.barbeiros?.name || '-',
        servico: entry.agendamentos?.servicos?.name || '-',
    }));
    const headers = ["Data", "Descrição", "Tipo", "Valor (R$)", "Barbeiro", "Serviço"];
    exportToCsv(`financeiro-${format(new Date(), 'yyyy-MM-dd')}.csv`, dataToExport, headers);
  };

  if (!selectedSede && !loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Nenhuma Sede Selecionada</CardTitle>
                    <CardDescription>Para gerenciar as finanças, você precisa primeiro selecionar uma sede.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Use o seletor no menu lateral.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport} disabled={entries.length === 0}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar CSV
              </Button>
              <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setSelectedEntry(null); }}>
              <DialogTrigger asChild>
                  <Button onClick={handleAddNew} disabled={!selectedSede}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>{selectedEntry ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle></DialogHeader>
                  {selectedSede && <FinancialEntryForm onSuccess={handleFormSuccess} entry={selectedEntry} sedeId={selectedSede.id} />}
              </DialogContent>
              </Dialog>
          </div>
        </div>

        <DateRangeSelector date={dateRange} setDate={setDateRange} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Entradas</CardTitle><ArrowUpCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">R$ {totalEntradas.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Saídas</CardTitle><ArrowDownCircle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">R$ {totalSaidas.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Saldo</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${saldo >= 0 ? 'text-foreground' : 'text-destructive'}`}>R$ {saldo.toFixed(2)}</div></CardContent></Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Receita por Barbeiro</CardTitle></CardHeader>
            <CardContent className="space-y-4">{loading ? <Skeleton className="h-20 w-full" /> : revenueByBarber.length > 0 ? revenueByBarber.map(item => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                  <div>
                      <p>{item.name}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Comissão: R$ {item.commission.toFixed(2)}</p>
                  </div>
                  <p className="font-medium">R$ {item.total.toFixed(2)}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">Sem dados de agendamentos.</p>}
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Scissors className="h-5 w-5" /> Receita por Serviço</CardTitle></CardHeader>
            <CardContent className="space-y-2">{loading ? <Skeleton className="h-20 w-full" /> : revenueByService.length > 0 ? revenueByService.map(item => (
              <div key={item.name} className="flex justify-between items-center text-sm"><p>{item.name}</p><p className="font-medium">R$ {item.total.toFixed(2)}</p></div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">Sem dados de agendamentos.</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                  {selectedSede 
                      ? `Lançamentos para ${selectedSede.name} no período selecionado.`
                      : "Lançamentos de todas as sedes no período selecionado."
                  }
              </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-10"><p className="text-gray-500">Nenhum lançamento encontrado para este período.</p></div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {entry.tipo === 'entrada' ? <ArrowUpCircle className="h-6 w-6 text-green-500" /> : <ArrowDownCircle className="h-6 w-6 text-red-500" />}
                      <div>
                        <p className="font-bold">{entry.descricao}</p>
                        <p className="text-sm text-gray-500">{format(new Date(entry.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-bold ${entry.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>R$ {entry.valor.toFixed(2)}</p>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(entry)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente este lançamento.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(entry.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Financeiro;