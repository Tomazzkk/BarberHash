import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSessionStore } from "@/hooks/useSessionStore";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Award } from "lucide-react";

const PlanFeatureManager = () => {
    const { config, user, fetchSessionData, session } = useSessionStore();
    const [isLoading, setIsLoading] = useState(false);
    const isEnabled = config?.custom_features?.includes('plan_system') || false;

    const handleToggle = async (enable: boolean) => {
        if (!user) {
            showError("Usuário não encontrado.");
            return;
        }
        setIsLoading(true);
        const toastId = showLoading(enable ? "Ativando sistema de planos..." : "Desativando sistema de planos...");

        const currentFeatures = config?.custom_features?.filter(f => f !== 'plan_system') || [];
        
        let newFeatures;
        if (enable) {
            newFeatures = [...currentFeatures, 'plan_system'];
        } else {
            newFeatures = currentFeatures;
        }

        const { error } = await supabase
            .from('config_cliente')
            .upsert({ user_id: user.id, custom_features: newFeatures }, { onConflict: 'user_id' });

        dismissToast(toastId);
        if (error) {
            showError(`Erro: ${error.message}`);
        } else {
            showSuccess(`Sistema de planos ${enable ? 'ativado' : 'desativado'} com sucesso!`);
            if (session) fetchSessionData(session); // Refresh session to update the state
        }
        setIsLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sistema de Planos</CardTitle>
                <CardDescription>
                    Ative para oferecer planos de assinatura mensais para seus clientes. Quando ativado, uma nova aba "Planos" aparecerá no aplicativo do cliente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="plan-feature-mode"
                        checked={isEnabled}
                        onCheckedChange={handleToggle}
                        disabled={isLoading}
                    />
                    <Label htmlFor="plan-feature-mode" className="flex items-center gap-2">
                        <Award className={`h-4 w-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                        {isLoading ? "Aguarde..." : (isEnabled ? "Sistema de Planos Ativo" : "Sistema de Planos Inativo")}
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlanFeatureManager;