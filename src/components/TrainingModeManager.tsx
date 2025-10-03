import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSessionStore } from "@/hooks/useSessionStore";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FlaskConical } from "lucide-react";

const TrainingModeManager = () => {
    const { trainingModeActive, fetchSessionData, session } = useSessionStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleToggle = async (enable: boolean) => {
        setIsLoading(true);
        const toastId = showLoading(enable ? "Ativando Modo Treinamento..." : "Desativando Modo Treinamento...");

        const { error } = await supabase.functions.invoke('toggle-training-mode', {
            body: { enable }
        });

        dismissToast(toastId);
        if (error) {
            showError(`Erro: ${error.message}`);
        } else {
            showSuccess(`Modo Treinamento ${enable ? 'ativado' : 'desativado'} com sucesso!`);
            fetchSessionData(session); // Refresh session to update the state
        }
        setIsLoading(false);
        setShowConfirmation(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Modo de Treinamento</CardTitle>
                    <CardDescription>
                        Ative para preencher o sistema com dados de exemplo (clientes, agendamentos, etc.) e explore as funcionalidades sem afetar seus dados reais. Desativar removerá todos os dados de exemplo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="training-mode"
                            checked={trainingModeActive}
                            onCheckedChange={() => setShowConfirmation(true)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="training-mode" className="flex items-center gap-2">
                            <FlaskConical className={`h-4 w-4 ${trainingModeActive ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                            {isLoading ? "Aguarde..." : (trainingModeActive ? "Modo Treinamento Ativo" : "Modo Treinamento Inativo")}
                        </Label>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {trainingModeActive
                                ? "Isso removerá permanentemente todos os dados de exemplo do seu sistema. Seus dados reais não serão afetados."
                                : "Isso irá gerar uma série de dados de exemplo (clientes, agendamentos, etc.) para você testar. Você pode removê-los a qualquer momento desativando este modo."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleToggle(!trainingModeActive)}>
                            {trainingModeActive ? "Sim, Desativar" : "Sim, Ativar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default TrainingModeManager;