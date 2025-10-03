import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import PlanForm from "@/components/forms/PlanForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/hooks/useSessionStore";
import PlanFeatureManager from "@/components/PlanFeatureManager";
import PlanBenefitManager from "@/components/PlanBenefitManager";
import { useQuery } from "@tanstack/react-query";
import { PlanBenefit } from "@/components/forms/PlanBenefitForm";

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  is_popular: boolean;
  features: string[];
};

const PlanManagement = () => {
  const { user, config } = useSessionStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { data: allBenefits } = useQuery<PlanBenefit[]>({
    queryKey: ['plan_benefits'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("plan_benefits").select("id").eq('owner_user_id', user.id);
      if (error) {
        console.error("Error fetching plan benefits for count:", error);
        return [];
      }
      return data;
    },
    enabled: !!user,
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("planos").select("*").order("price");
    if (error) {
        showError("Erro ao buscar planos: " + error.message);
        setPlans([]);
    } else if (data) {
        const parsedPlans = data.map(plan => {
            let featuresArray: string[] = [];
            if (typeof plan.features === 'string') {
                try {
                    const parsed = JSON.parse(plan.features);
                    if (Array.isArray(parsed)) {
                        featuresArray = parsed;
                    }
                } catch (e) {
                    console.warn("Could not parse plan features as JSON:", plan.features, e);
                }
            } else if (Array.isArray(plan.features)) {
                featuresArray = plan.features;
            }
            return { ...plan, features: featuresArray };
        });
        setPlans(parsedPlans as Plan[]);
    } else {
        setPlans([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedPlan(null);
    fetchPlans();
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (planId: string) => {
    const toastId = showLoading("Excluindo plano...");
    const { error } = await supabase.from("planos").delete().eq("id", planId);
    dismissToast(toastId);
    if (error) showError("Erro ao excluir plano: " + error.message);
    else {
      showSuccess("Plano excluído com sucesso!");
      fetchPlans();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedPlan(null); setIsFormOpen(isOpen); }}>
            <DialogTrigger asChild><Button onClick={handleAddNew} disabled={!config?.plan_feature_enabled}><PlusCircle className="mr-2 h-4 w-4" /> Novo Plano</Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{selectedPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader><PlanForm onSuccess={handleFormSuccess} plan={selectedPlan} /></DialogContent>
          </Dialog>
        </div>

        <PlanFeatureManager />
        
        {config?.plan_feature_enabled && <PlanBenefitManager />}

        {config?.plan_feature_enabled && (
            <Card>
            <CardHeader><CardTitle>Planos de Assinatura</CardTitle><CardDescription>Crie e gerencie os planos que seus clientes podem assinar.</CardDescription></CardHeader>
            <CardContent>
                {loading ? <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                : plans.length === 0 ? <div className="text-center py-10"><p className="text-muted-foreground">Nenhum plano cadastrado.</p><Button onClick={handleAddNew} className="mt-4">Criar Primeiro Plano</Button></div>
                : <div className="space-y-4">{plans.map((plan) => {
                    const validBenefitCount = plan.features.filter(featureId => 
                        allBenefits?.some(benefit => benefit.id === featureId)
                    ).length;
                    
                    return (
                    <div key={plan.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-muted p-3 rounded-full"><Package className="h-6 w-6 text-primary" /></div>
                        <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{plan.name}</p>
                            <Badge variant={plan.is_active ? "default" : "outline"}>{plan.is_active ? "Ativo" : "Inativo"}</Badge>
                            {plan.is_popular && <Badge variant="secondary">Popular</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{validBenefitCount} benefícios inclusos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="font-semibold text-lg">R$ {plan.price.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        <AlertDialog>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEdit(plan)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente este plano.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(plan.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </div>
                    </div>
                )})}</div>}
            </CardContent>
            </Card>
        )}
      </div>
    </>
  );
};

export default PlanManagement;