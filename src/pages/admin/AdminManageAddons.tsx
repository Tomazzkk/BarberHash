import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import AddonForm, { Addon } from "@/components/forms/AddonForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, Puzzle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const AdminManageAddons = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);

  const fetchAddons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("addons").select("*").order("name");
    if (error) showError("Erro ao buscar addons: " + error.message);
    else setAddons(data as Addon[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAddons(); }, [fetchAddons]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedAddon(null);
    fetchAddons();
  };

  const handleEdit = (addon: Addon) => {
    setSelectedAddon(addon);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAddon(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (addonId: string) => {
    const toastId = showLoading("Excluindo addon...");
    const { error } = await supabase.from("addons").delete().eq("id", addonId);
    dismissToast(toastId);
    if (error) showError("Erro ao excluir addon: " + error.message);
    else {
      showSuccess("Addon excluído com sucesso!");
      fetchAddons();
    }
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Add-ons</h1>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedAddon(null); setIsFormOpen(isOpen); }}>
            <DialogTrigger asChild><Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Novo Add-on</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{selectedAddon ? "Editar Add-on" : "Novo Add-on"}</DialogTitle></DialogHeader><AddonForm onSuccess={handleFormSuccess} addon={selectedAddon} /></DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader><CardTitle>Add-ons de Funcionalidades</CardTitle><CardDescription>Crie e gerencie os recursos extras que podem ser adicionados aos planos.</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            : addons.length === 0 ? <div className="text-center py-10"><p className="text-muted-foreground">Nenhum add-on cadastrado.</p><Button onClick={handleAddNew} className="mt-4">Criar Primeiro Add-on</Button></div>
            : <div className="space-y-4">{addons.map((addon) => (
                <div key={addon.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-3 rounded-full"><Puzzle className="h-6 w-6 text-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2"><p className="font-bold text-lg">{addon.name}</p><Badge variant={addon.is_active ? "default" : "outline"}>{addon.is_active ? "Ativo" : "Inativo"}</Badge></div>
                      <p className="text-sm text-muted-foreground">Chave: {addon.feature_key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-lg">R$ {addon.monthly_price.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                    <AlertDialog>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEdit(addon)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente este add-on.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(addon.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}</div>}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminManageAddons;