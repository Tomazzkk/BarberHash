import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Package, ShoppingCart, DollarSign, Megaphone } from "lucide-react";

const featureDetails: { [key: string]: { icon: React.ElementType, name: string, description: string } } = {
    pdv: { icon: ShoppingCart, name: "Ponto de Venda (PDV)", description: "Registre vendas de produtos e serviços rapidamente." },
    estoque: { icon: Package, name: "Controle de Estoque", description: "Gerencie o inventário de produtos da sua barbearia." },
    financeiro: { icon: DollarSign, name: "Financeiro Completo", description: "Acesse o fluxo de caixa e relatórios financeiros detalhados." },
    marketing: { icon: Megaphone, name: "Ferramentas de Marketing", description: "Crie promoções e envie campanhas de WhatsApp." },
};

const Plano = () => {
    const { plan, loading } = useSessionStore();

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Meu Plano</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-6 w-6 text-primary" />
                        {plan?.name || "Plano Básico"}
                    </CardTitle>
                    <CardDescription>
                        Estes são os recursos disponíveis na sua assinatura atual.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4">Recursos Incluídos:</h3>
                    <div className="space-y-4">
                        {plan?.features && plan.features.length > 0 ? (
                            plan.features.map(featureKey => {
                                const feature = featureDetails[featureKey];
                                if (!feature) return null;
                                const Icon = feature.icon;
                                return (
                                    <div key={featureKey} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                                        <Icon className="h-6 w-6 text-green-500 mt-1" />
                                        <div>
                                            <p className="font-semibold">{feature.name}</p>
                                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-muted-foreground">Seu plano atual inclui as funcionalidades essenciais de agendamento e gestão.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Plano;