import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import PromocaoForm, { Promocao } from "@/components/forms/PromocaoForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, TicketPercent } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const Promocoes = () => {
  const selectedSede = useSessionStore((state) => state.selectedSede);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPromocao, setSelectedPromocao] = useState<Promocao | null>(null);

  const fetchPromocoes = useCallback(async () => {
    if (!selectedSede) {
        setPromocoes([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("promocoes")
      .select("*")
      .eq("sede_id", selectedSede.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Erro ao buscar promoções: " + error.message);
      setPromocoes([]);
    } else {
      setPromocoes(data as Promocao[]);
    }
    setLoading(false);
  }, [selectedSede]);

  useEffect(() => {
    fetchPromocoes();
  }, [fetchPromocoes]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedPromocao(null);
    fetchPromocoes();
  };

  const handleEdit = (promocao: Promocao) => {
    setSelectedPromocao(promocao);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPromocao(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (promocaoId: string) => {
    const toastId = showLoading("Excluindo promoção...");
    const { error } = await supabase.from("promocoes").delete().eq("id", promocaoId);
    dismissToast(toastId);
    if (error) {
      showError("Erro ao excluir promoção: " + error.message);
    } else {
      showSuccess("Promoção excluída com sucesso!");
      fetchPromocoes();
    }
  };

  const getStatus = (promocao: Promocao): { text: string; variant: "default" | "secondary" | "outline" } => {
    const now = new Date();
    const start = new Date(promocao.start_date);
    const end = new Date(promocao.end_date);
    if (!promocao.is_active) return { text: "Inativa", variant: "outline" };
    if (now < start) return { text: "Agendada", variant: "secondary" };
    if (now > end) return { text: "Expirada", variant: "outline" };
    return { text: "Ativa", variant: "default" };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (!selectedSede && !loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md"><CardHeader><CardTitle>Nenhuma Sede Selecionada</CardTitle><CardDescription>Para gerenciar promoções, você precisa primeiro selecionar uma sede.</CardDescription></CardHeader><CardContent><Button asChild><Link to="/sedes">Gerenciar Sedes</Link></Button></CardContent></Card>
        </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Promoções</h1>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedPromocao(null); setIsFormOpen(isOpen); }}>
            <DialogTrigger asChild><Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Nova Promoção</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{selectedPromocao ? "Editar Promoção" : "Nova Promoção"}</DialogTitle></DialogHeader>{selectedSede && <PromocaoForm onSuccess={handleFormSuccess} promocao={selectedPromocao} sedeId={selectedSede.id} />}</DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader><CardTitle>Promoções de {selectedSede?.name}</CardTitle><CardDescription>Crie e gerencie suas campanhas promocionais.</CardDescription></CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : promocoes.length === 0 ? (
              <EmptyState
                icon={<TicketPercent className="h-12 w-12" />}
                title="Nenhuma promoção criada"
                description="Crie promoções para atrair mais clientes e aumentar o faturamento em datas especiais."
              >
                <Button onClick={handleAddNew}>Criar Primeira Promoção</Button>
              </EmptyState>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {promocoes.map((p) => {
                  const status = getStatus(p);
                  return (
                  <motion.div
                    key={p.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                          <AlertDialog>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mr-2 h-8 w-8"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(p)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger>
                            </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente esta promoção.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                          </AlertDialog>
                      </CardHeader>
                      <CardContent>
                          <Badge variant={status.variant} className="mb-2">{status.text}</Badge>
                          <p className="text-sm text-muted-foreground">
                              {p.discount_type === 'percentage' ? `${p.discount_value}% de desconto` : `R$ ${p.discount_value} de desconto`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                              Válido de {format(new Date(p.start_date), 'dd/MM/yy', { locale: ptBR })} a {format(new Date(p.end_date), 'dd/MM/yy', { locale: ptBR })}
                          </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )})}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Promocoes;