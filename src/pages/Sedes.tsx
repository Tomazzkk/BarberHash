import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import SedeForm, { Sede } from "@/components/forms/SedeForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, Home, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Badge } from "@/components/ui/badge";

type SedeWithMatriz = Sede & { is_matriz: boolean };

const Sedes = () => {
  const { user } = useSessionStore();
  const [sedes, setSedes] = useState<SedeWithMatriz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState<SedeWithMatriz | null>(null);

  const fetchSedes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sedes")
      .select("*")
      .order("is_matriz", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      showError("Erro ao buscar sedes: " + error.message);
      setSedes([]);
    } else {
      setSedes(data as SedeWithMatriz[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSedes();
  }, [fetchSedes]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedSede(null);
    fetchSedes();
  };

  const handleEdit = (sede: SedeWithMatriz) => {
    setSelectedSede(sede);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSede(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (sedeId: string) => {
    const toastId = showLoading("Excluindo sede...");
    const { error } = await supabase.from("sedes").delete().eq("id", sedeId);
    dismissToast(toastId);

    if (error) {
      showError("Erro ao excluir sede: " + error.message);
    } else {
      showSuccess("Sede excluída com sucesso!");
      fetchSedes();
    }
  };

  const handleSetMatriz = async (sedeId: string) => {
    if (!user) return;
    const toastId = showLoading("Definindo como Matriz...");
    const { error } = await supabase.rpc('set_matriz', { p_sede_id: sedeId, p_user_id: user.id });
    dismissToast(toastId);
    if (error) {
      showError("Erro ao definir matriz: " + error.message);
    } else {
      showSuccess("Sede definida como Matriz!");
      fetchSedes();
    }
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sedes e Filiais</h1>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setSelectedSede(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Sede
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedSede ? "Editar Sede" : "Adicionar Nova Sede"}</DialogTitle>
              </DialogHeader>
              <SedeForm onSuccess={handleFormSuccess} sede={selectedSede} />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Suas Unidades</CardTitle>
            <CardDescription>Gerencie todas as unidades da sua barbearia e defina a principal.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : sedes.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Você ainda não cadastrou nenhuma sede. Clique no botão acima para começar.</p>
                <Button onClick={handleAddNew} className="mt-4">Adicionar Primeira Sede</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sedes.map((sede) => (
                  <div key={sede.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted p-3 rounded-full">
                          <Home className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{sede.name}</p>
                            {sede.is_matriz && <Badge><Star className="mr-1 h-3 w-3" /> Matriz</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{sede.address || "Sem endereço"}</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!sede.is_matriz && (
                            <DropdownMenuItem onClick={() => handleSetMatriz(sede.id)}>
                              <Star className="mr-2 h-4 w-4" />
                              Tornar Matriz
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(sede)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente a sede e pode desvincular barbeiros e outros registros associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(sede.id)} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

export default Sedes;