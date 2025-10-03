import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, Gift, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { benefitIcons } from "@/lib/icons";
import { PlanBenefit } from "@/components/forms/PlanBenefitForm";

type Plan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  is_popular?: boolean;
};

const Planos = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allBenefits, setAllBenefits] = useState<PlanBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const { config } = useSessionStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlansData = async () => {
      if (!config) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [plansRes, benefitsRes] = await Promise.all([
        supabase.from('planos').select('*').eq('owner_user_id', config.user_id).eq('is_active', true).order('price', { ascending: true }),
        supabase.from('plan_benefits').select('*').eq('owner_user_id', config.user_id)
      ]);

      if (plansRes.error || benefitsRes.error) {
        showError("Não foi possível carregar os dados dos planos.");
      } else {
        setPlans(plansRes.data as Plan[]);
        setAllBenefits(benefitsRes.data as PlanBenefit[]);
        const popularPlan = plansRes.data.find(p => p.is_popular);
        if (popularPlan) {
          setSelectedPlanId(popularPlan.id);
        } else if (plansRes.data.length > 0) {
          setSelectedPlanId(plansRes.data[0].id);
        }
      }
      setLoading(false);
    };

    fetchPlansData();
  }, [config]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  if (loading) {
    return (
        <div className="p-4 space-y-6">
            <div className="text-center space-y-4">
                <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-5 w-64 mx-auto" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  if (plans.length === 0) {
    return (
        <div className="p-4 text-center">
            <div className="inline-block p-4 bg-muted rounded-full mb-4">
                <Award className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Planos de Assinatura</h1>
            <p className="text-muted-foreground mt-2">
              Nenhum plano de assinatura disponível no momento.
            </p>
        </div>
    );
  }

  return (
    <div className="p-4 flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="text-center mb-6">
        <div className="inline-block p-4 bg-muted rounded-full mb-4">
            <Award className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Planos de Assinatura</h1>
        <p className="text-muted-foreground mt-2">
          Escolha o plano perfeito e aproveite benefícios exclusivos.
        </p>
      </div>

      <div className="space-y-4 mb-6 flex-grow">
        {selectedPlan && selectedPlan.features.map((featureId) => {
            const benefit = allBenefits.find(b => b.id === featureId);
            if (!benefit) return null;
            const Icon = benefitIcons[benefit.icon] || HelpCircle;
            return (
              <div key={featureId} className="flex items-start gap-4">
                <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{benefit.label}</p>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            );
        })}
      </div>

      <div className="mt-auto space-y-4">
        <Carousel
          opts={{ align: "start" }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {plans.map((plan) => (
              <CarouselItem key={plan.id} className="pl-4 pt-4 basis-[45%] sm:basis-1/3">
                <div
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "cursor-pointer transition-all relative text-center p-3 rounded-lg border-2 flex flex-col justify-center h-28",
                    selectedPlanId === plan.id ? "border-primary bg-primary/10" : "border-muted bg-muted/50"
                  )}
                >
                  {plan.is_popular && <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 px-1 text-xs">Popular</Badge>}
                  <p className="font-bold text-sm">{plan.name}</p>
                  <p className="text-xl font-bold">R${plan.price}</p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-4" />
          <CarouselNext className="hidden sm:flex -right-4" />
        </Carousel>

        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="w-full text-muted-foreground">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Como funciona a assinatura?
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Como funciona a assinatura</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-4">
                        <Award className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Sempre no Estilo</h3>
                            <p className="text-sm text-muted-foreground">Garanta seus cortes e serviços com um valor fixo mensal.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Calendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Agendamento Prioritário</h3>
                            <p className="text-sm text-muted-foreground">Acesso aos melhores horários antes de todo mundo.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Gift className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Benefícios Exclusivos</h3>
                            <p className="text-sm text-muted-foreground">Descontos em produtos e serviços especiais só para membros.</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Button size="lg" className="w-full h-12 font-bold">
          Assinar Plano {selectedPlan?.name}
        </Button>
      </div>
    </div>
  );
};

export default Planos;