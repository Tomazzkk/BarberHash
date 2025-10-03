import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSessionStore } from "@/hooks/useSessionStore";
import { ClipboardList, AlertCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";

type LogEntry = {
  id: string;
  action: string;
  details: any;
  created_at: string;
};

const ActivityLog = () => {
  const user = useSessionStore((state) => state.user);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      showError("Erro ao buscar registro de atividades: " + error.message);
    } else {
      setLogs(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const renderDetails = (details: any) => {
    if (!details) return 'N/A';
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('; ');
  };

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Registro de Atividades</h1>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Ações</CardTitle>
            <CardDescription>
              Aqui estão as últimas 100 ações importantes registradas no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : logs.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="h-12 w-12" />}
                title="Nenhuma atividade registrada"
                description="Quando ações importantes forem realizadas no sistema, elas aparecerão aqui para sua referência."
              />
            ) : (
              <div className="relative pl-6 after:absolute after:inset-y-0 after:w-px after:bg-border after:left-0">
                {logs.map((log) => (
                  <div key={log.id} className="relative grid grid-cols-[auto_1fr] items-start gap-x-4 pb-8">
                    <div className="relative flex h-6 w-6 items-center justify-center">
                      <span className="absolute -left-6 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background">
                        <span className="h-3 w-3 rounded-full bg-primary" />
                      </span>
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold text-foreground">{log.action}</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {renderDetails(log.details)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
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

export default ActivityLog;