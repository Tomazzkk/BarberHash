import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import BarberForm from "@/components/forms/BarberForm";
import WorkingHoursForm from "@/components/forms/WorkingHoursForm";
import PermissionsForm from "@/components/forms/PermissionsForm";
import PortfolioManager from "@/components/forms/PortfolioManager";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, UserCog, Clock, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/hooks/useSessionStore";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Barber = {
  id: string;
  name: string;
  working_hours?: any;
  commission_percentage?: number;
  bio?: string | null;
  specialty?: string | null;
  experience_years?: number | null;
};

const Barbeiros = () => {
  const { selectedSede, ownerId } = useSessionStore();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHoursFormOpen, setIsHoursFormOpen] = useState(false);
  const [isPermissionsFormOpen, setIsPermissionsFormOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  const fetchBarbers = useCallback(async () => {
    if (!selectedSede || !ownerId) {
        setBarbers([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("barbeiros")
      .select("*")
      .eq("user_id", ownerId)
      .eq("sede_id", selectedSede.id)
      .order("name", { ascending: true });

    if (error) {
      showError("Erro ao buscar barbeiros: " + error.message);
      setBarbers([]);
    } else {
      setBarbers(data as Barber[]);
    }
    setLoading(false);
  }, [selectedSede, ownerId]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedBarber(null);
    fetchBarbers();
  };
  
  const handleHoursFormSuccess = () => {
    setIsHoursFormOpen(false);
    setSelectedBarber(null);
    fetchBarbers();
  };

  const handlePermissionsFormSuccess = () => {
    setIsPermissionsFormOpen(false);
    setSelectedBarber(null);
    fetchBarbers();
  };

  const handleEdit = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsFormOpen(true);
  };
  
  const handleEditHours = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsHoursFormOpen(true);
  };

  const handleManagePermissions = (barber: Barber) => {
    setSelectedBarber(barber);
    setIsPermissionsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBarber(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (barberId: string) => {
    const toastId = showLoading("Removendo barbeiro da equipe...");
    const { error } = await supabase.rpc('demote_barber', { p_barber_id: barberId });
    dismissToast(toastId);

    if (error) {
      showError("Erro ao remover barbeiro: " + error.message);
    } else {
      showSuccess("Barbeiro removido da equipe com sucesso!");
      fetchBarbers();
    }
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

  if (!selectedSede && !loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Nenhuma Sede Selecionada</CardTitle>
                    <CardDescription>Para gerenciar barbeiros, você precisa primeiro selecionar ou criar uma sede.</CardDescription>
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
          <h1 className="text-3xl font-bold">Barbeiros</h1>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setSelectedBarber(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Barbeiro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedBarber ? `Editar: ${selectedBarber.name}` : "Novo Barbeiro"}</DialogTitle>
              </DialogHeader>
              {selectedBarber ? (
                <Tabs defaultValue="dados">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dados">Dados</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
                  </TabsList>
                  <TabsContent value="dados" className="pt-4">
                    {selectedSede && <BarberForm onSuccess={handleFormSuccess} barber={selectedBarber} />}
                  </TabsContent>
                  <TabsContent value="portfolio" className="pt-4">
                    <PortfolioManager barber={selectedBarber} />
                  </TabsContent>
                </Tabs>
              ) : (
                selectedSede && <BarberForm onSuccess={handleFormSuccess} barber={selectedBarber} />
              )}
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Equipe de {selectedSede?.name}</CardTitle>
            <CardDescription>Gerencie os profissionais da sua barbearia.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : barbers.length === 0 ? (
              <EmptyState
                icon={<UserCog className="h-12 w-12" />}
                title="Nenhum profissional cadastrado"
                description="Adicione os barbeiros da sua equipe para começar a atribuir agendamentos e gerenciar horários."
              >
                <Button onClick={handleAddNew}>Adicionar Primeiro Barbeiro</Button>
              </EmptyState>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {barbers.map((barber) => (
                  <motion.div
                    key={barber.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-lg font-bold">{barber.name}</CardTitle>
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(barber)}><Edit className="mr-2 h-4 w-4" /> Editar / Portfólio</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleManagePermissions(barber)}><ShieldCheck className="mr-2 h-4 w-4" /> Permissões</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditHours(barber)}><Clock className="mr-2 h-4 w-4" /> Horários</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente o barbeiro.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(barber.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">Comissão: {barber.commission_percentage || 0}%</p>
                          {barber.specialty && <p className="text-sm text-muted-foreground">Especialidade: {barber.specialty}</p>}
                          {barber.experience_years != null && <p className="text-sm text-muted-foreground">{barber.experience_years} anos de exp.</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {selectedBarber && (
          <>
              <Dialog open={isHoursFormOpen} onOpenChange={(isOpen) => {
                setIsHoursFormOpen(isOpen);
                if (!isOpen) setSelectedBarber(null);
              }}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Horários de {selectedBarber.name}</DialogTitle>
                    <CardDescription>Defina os dias e horários de trabalho, incluindo pausas.</CardDescription>
                  </DialogHeader>
                  <WorkingHoursForm onSuccess={handleHoursFormSuccess} barber={selectedBarber} />
                </DialogContent>
              </Dialog>

              <Dialog open={isPermissionsFormOpen} onOpenChange={(isOpen) => {
                setIsPermissionsFormOpen(isOpen);
                if (!isOpen) setSelectedBarber(null);
              }}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Permissões de {selectedBarber.name}</DialogTitle>
                    <CardDescription>Controle o que este profissional pode acessar no sistema.</CardDescription>
                  </DialogHeader>
                  <PermissionsForm onSuccess={handlePermissionsFormSuccess} barber={selectedBarber} />
                </DialogContent>
              </Dialog>
          </>
        )}
      </div>
    </>
  );
};

export default Barbeiros;