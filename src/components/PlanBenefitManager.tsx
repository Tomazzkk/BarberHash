import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PlanBenefitForm, { PlanBenefit } from "./forms/PlanBenefitForm";
import { benefitIcons } from "@/lib/icons";

const PlanBenefitManager = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<PlanBenefit | null>(null);

  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ['plan_benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_benefits").select("*").order("label");
      if (error) throw error;
      return data as PlanBenefit[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (benefitId: string) => {
      const { error } = await supabase.from("plan_benefits").delete().eq("id", benefitId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Benefício excluído!");
      queryClient.invalidateQueries({ queryKey: ['plan_benefits'] });
    },
    onError: (error: any) => {
        console.error("Erro ao excluir benefício:", error);
        showError(`Erro ao excluir: ${error.message || 'Ocorreu um erro desconhecido.'}`);
    }
  });

  const handleEdit = (benefit: PlanBenefit) => {
    setSelectedBenefit(benefit);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBenefit(null);
    setIsFormOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Benefícios dos Planos</CardTitle>
          <CardDescription>Crie e gerencie os benefícios que você pode oferecer nos seus planos.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedBenefit(null); setIsFormOpen(isOpen); }}>
          <DialogTrigger asChild><Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Novo Benefício</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{selectedBenefit ? "Editar Benefício" : "Novo Benefício"}</DialogTitle></DialogHeader><PlanBenefitForm onSuccess={() => setIsFormOpen(false)} benefit={selectedBenefit} /></DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-24 w-full" /> : benefits.length === 0 ? <p className="text-center text-muted-foreground py-4">Nenhum benefício criado.</p> : (
          <div className="space-y-2">
            {benefits.map(benefit => {
              const Icon = benefitIcons[benefit.icon] || MoreVertical;
              return (
                <div key={benefit.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{benefit.label}</p>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(benefit)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle><AlertDialogDescription>Este benefício será removido de todos os planos que o utilizam.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(benefit.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanBenefitManager;