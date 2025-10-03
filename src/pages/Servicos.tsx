import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import ServiceForm from "@/components/forms/ServiceForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, Scissors, AlertCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";
import { Alert, AlertTitle } from "@/components/ui/alert";

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  sinal_required?: boolean;
  sinal_value?: number;
};

const fetchServices = async (sedeId: string | null) => {
    if (!sedeId) return [];
    const { data, error } = await supabase
      .from("servicos")
      .select("*")
      .eq("sede_id", sedeId)
      .order("name", { ascending: true });
    if (error) throw error;
    return data as Service[];
};

const Servicos = () => {
  const selectedSede = useSessionStore((state) => state.selectedSede);
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', selectedSede?.id],
    queryFn: () => fetchServices(selectedSede?.id || null),
    enabled: !!selectedSede,
  });

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
        const { error } = await supabase.from("servicos").delete().eq("id", serviceId);
        if (error) throw error;
    },
    onSuccess: () => {
        showSuccess("Serviço excluído com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['services', selectedSede?.id] });
    },
    onError: (error) => {
        showError("Erro ao excluir serviço: " + error.message);
    }
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedService(null);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (!selectedSede && !isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Nenhuma Sede Selecionada</CardTitle>
                    <CardDescription>Para gerenciar serviços, você precisa primeiro selecionar ou criar uma sede.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/sedes">Gerenciar Sedes</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Serviços</h1>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setSelectedService(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} disabled={!selectedSede}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
              </DialogHeader>
              {selectedSede && <ServiceForm onSuccess={handleFormSuccess} service={selectedService} />}
            </DialogContent>
          </Dialog>
        </div>
        
        {!selectedSede && (
            <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Selecione uma sede para gerenciar os serviços.</AlertTitle>
            </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Serviços de {selectedSede?.name}</CardTitle>
            <CardDescription>Gerencie os serviços oferecidos nesta unidade.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : services?.length === 0 ? (
              <EmptyState
                icon={<Scissors className="h-12 w-12" />}
                title="Nenhum serviço cadastrado"
                description="Crie os serviços que sua barbearia oferece para que seus clientes possam agendar."
              >
                <Button onClick={handleAddNew}>Adicionar Primeiro Serviço</Button>
              </EmptyState>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {services?.map((service) => (
                  <motion.div
                    key={service.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-lg font-bold">{service.name}</CardTitle>
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(service)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente este serviço.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(service.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">
                              R$ {service.price.toFixed(2)} • {service.duration_minutes} min
                          </p>
                          {service.sinal_required && service.sinal_value && (
                            <p className="text-xs font-semibold text-primary mt-1">(Sinal: R$ {service.sinal_value.toFixed(2)})</p>
                          )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Servicos;