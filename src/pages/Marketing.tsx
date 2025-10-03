import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Send, Wand2 } from "lucide-react";
import { subDays } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";

type Audience = 'all' | 'active' | 'inactive';

const Marketing = () => {
    const { user, selectedSede } = useSessionStore();
    const [audience, setAudience] = useState<Audience>('all');
    const [message, setMessage] = useState("");
    const [clientCounts, setClientCounts] = useState({ all: 0, active: 0, inactive: 0 });
    const [loadingCounts, setLoadingCounts] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchClientCounts = useCallback(async () => {
        if (!selectedSede) {
            setClientCounts({ all: 0, active: 0, inactive: 0 });
            setLoadingCounts(false);
            return;
        }
        setLoadingCounts(true);
        try {
            let allClientsQuery = supabase.from('clientes').select('*', { count: 'exact', head: true });
            if (selectedSede) allClientsQuery = allClientsQuery.eq('sede_id', selectedSede.id);
            const { count: allCount, error: allClientsError } = await allClientsQuery;
            if (allClientsError) throw allClientsError;

            const cutoffDate = subDays(new Date(), 90).toISOString();
            let activeClientsQuery = supabase.from('agendamentos').select('cliente_id').gte('start_time', cutoffDate);
            if (selectedSede) activeClientsQuery = activeClientsQuery.eq('sede_id', selectedSede.id);
            const { data: activeClientsData, error: activeError } = await activeClientsQuery;
            if (activeError) throw activeError;
            
            const activeClientIds = new Set(activeClientsData.map(a => a.cliente_id));
            const activeCount = activeClientIds.size;
            const inactiveCount = (allCount || 0) - activeCount;

            setClientCounts({ all: allCount || 0, active: activeCount, inactive: inactiveCount });
        } catch (error: any) {
            showError("Erro ao carregar contagem de clientes: " + error.message);
        } finally {
            setLoadingCounts(false);
        }
    }, [selectedSede]);

    useEffect(() => {
        fetchClientCounts();
    }, [fetchClientCounts]);

    const handleGenerateSuggestion = async () => {
        setIsGenerating(true);
        const toastId = showLoading("Aguarde, a IA está criando uma sugestão...");

        try {
            const { data, error } = await supabase.functions.invoke('generate-campaign-suggestion', {
                body: { audience, sedeId: selectedSede?.id || null }
            });

            if (error) throw error;

            setMessage(data.suggestion);
            showSuccess("Sugestão gerada!");
        } catch (error: any) {
            showError(`Erro ao gerar sugestão: ${error.message}`);
        } finally {
            dismissToast(toastId);
            setIsGenerating(false);
        }
    };

    const handleSendCampaign = async () => {
        if (!user) {
            showError("Você precisa estar logado.");
            return;
        }
        if (!message.trim()) {
            showError("A mensagem não pode estar vazia.");
            return;
        }

        setIsSending(true);
        const toastId = showLoading("Enviando campanha...");

        const { data, error } = await supabase.functions.invoke('send-whatsapp-campaign', {
            body: { 
                audience, 
                message,
                sedeId: selectedSede ? selectedSede.id : null
            }
        });

        dismissToast(toastId);
        if (error) {
            showError(`Erro ao enviar campanha: ${error.message}`);
        } else {
            showSuccess(data.message || "Campanha enviada com sucesso!");
            setMessage("");
        }
        setIsSending(false);
    };

    const audienceCount = clientCounts[audience];

    if (!selectedSede) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Nenhuma Sede Selecionada</CardTitle>
                        <CardDescription>Para criar campanhas de marketing, você precisa primeiro selecionar uma sede.</CardDescription>
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
            <div>
                <h1 className="text-3xl font-bold mb-6">Campanhas de Marketing</h1>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Megaphone /> Criar Nova Campanha</CardTitle>
                        <CardDescription>
                            Envie mensagens em massa via WhatsApp para os clientes de {selectedSede ? selectedSede.name : "todas as sedes"}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="audience-select">1. Escolha o Público</Label>
                            {loadingCounts ? <Skeleton className="h-10 w-full" /> : (
                                <Select value={audience} onValueChange={(value) => setAudience(value as Audience)}>
                                    <SelectTrigger id="audience-select">
                                        <SelectValue placeholder="Selecione um público" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Clientes ({clientCounts.all})</SelectItem>
                                        <SelectItem value="active">Clientes Ativos ({clientCounts.active})</SelectItem>
                                        <SelectItem value="inactive">Clientes Inativos ({clientCounts.inactive})</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Ativos: agendamento nos últimos 90 dias. Inativos: sem agendamento há mais de 90 dias.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="message-textarea">2. Escreva sua Mensagem</Label>
                                <Button variant="outline" size="sm" onClick={handleGenerateSuggestion} disabled={isGenerating}>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    {isGenerating ? "Gerando..." : "Gerar com IA"}
                                </Button>
                            </div>
                            <Textarea
                                id="message-textarea"
                                placeholder="Ex: Olá! Temos um novo combo de corte + barba por um preço especial esta semana. Agende seu horário!"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                            />
                            <p className="text-sm text-muted-foreground">
                                A mensagem será enviada para todos os clientes do público selecionado que possuem um número de telefone cadastrado.
                            </p>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="lg" disabled={isSending || loadingCounts || audienceCount === 0}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {isSending ? "Enviando..." : `Enviar para ${audienceCount} cliente(s)`}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Envio?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Você está prestes a enviar a mensagem para <strong>{audienceCount} cliente(s)</strong>. Esta ação não pode ser desfeita.
                                        <br/><br/>
                                        <strong>Mensagem:</strong>
                                        <p className="mt-2 p-2 border rounded-md bg-muted text-sm">{message}</p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSendCampaign}>
                                        Sim, Enviar Campanha
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Marketing;