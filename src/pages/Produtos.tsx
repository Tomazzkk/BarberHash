import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import ProductForm, { Product } from "@/components/forms/ProductForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, Package, AlertTriangle, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/hooks/useSessionStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type ProductWithSede = Product & {
  sedes: { name: string } | null;
};

const fetchProducts = async (sedeId: string | null) => {
    if (!sedeId) return [];
    const { data, error } = await supabase
      .from("produtos")
      .select("*, sedes(name)")
      .eq("sede_id", sedeId)
      .order("name", { ascending: true });
    if (error) throw error;
    return data as ProductWithSede[];
};

const Produtos = () => {
  const selectedSede = useSessionStore((state) => state.selectedSede);
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['products', selectedSede?.id],
    queryFn: () => fetchProducts(selectedSede?.id || null),
    enabled: !!selectedSede,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
        const { error } = await supabase.from("produtos").delete().eq("id", productId);
        if (error) throw error;
    },
    onSuccess: () => {
        showSuccess("Produto excluído com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
        showError("Erro ao excluir produto: " + error.message);
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ productId, is_featured }: { productId: string, is_featured: boolean }) => {
        const { error } = await supabase
            .from("produtos")
            .update({ is_featured })
            .eq("id", productId);
        if (error) throw error;
    },
    onSuccess: () => {
        showSuccess("Produto atualizado!");
        queryClient.invalidateQueries({ queryKey: ['products', selectedSede?.id] });
    },
    onError: (error: any) => {
        showError("Erro ao atualizar produto: " + error.message);
    }
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Produtos</h1>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setSelectedProduct(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} disabled={!selectedSede}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              </DialogHeader>
              {selectedSede && <ProductForm onSuccess={handleFormSuccess} product={selectedProduct} />}
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Seus Produtos</CardTitle>
            <CardDescription>
              {selectedSede ? `Gerencie os produtos para venda de ${selectedSede.name}.` : "Visualização de todas as sedes. Selecione uma sede para gerenciar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Nenhum produto cadastrado. Adicione produtos para vender no PDV e exibir na vitrine do cliente.</p>
                <Button onClick={handleAddNew} className="mt-4" disabled={!selectedSede}>Adicionar Primeiro Produto</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                  const isLowStock = product.quantity <= (product.min_quantity || 0);
                  return (
                    <div key={product.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="bg-muted p-3 rounded-full">
                              <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                              <p className="font-bold text-lg">{product.name}</p>
                              {!selectedSede && product.sedes && (
                                  <Badge variant="secondary" className="mb-1">{product.sedes.name}</Badge>
                              )}
                              <p className="text-sm text-muted-foreground">
                                  {product.quantity} em estoque • R$ {product.price.toFixed(2)}
                              </p>
                              {isLowStock && (
                                  <Badge variant="destructive" className="mt-2">
                                      <AlertTriangle className="mr-1 h-3 w-3" />
                                      Estoque Baixo
                                  </Badge>
                              )}
                          </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Toggle
                            size="sm"
                            pressed={!!product.is_featured}
                            onPressedChange={(pressed) => {
                                toggleFeaturedMutation.mutate({ productId: product.id, is_featured: pressed });
                            }}
                            aria-label="Toggle featured"
                        >
                            <Star className={cn("h-4 w-4", product.is_featured && "fill-yellow-400 text-yellow-400")} />
                        </Toggle>
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={!selectedSede}>
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
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
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto do seu inventário.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(product.id)} className="bg-destructive hover:bg-destructive/90">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Produtos;