import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import ClientForm from "@/components/forms/ClientForm";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, MoreVertical, Users, UserPlus, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/hooks/useSessionStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

const fetchClients = async (ownerId: string | null, sedeId: string | null) => {
    if (!ownerId) return [];
    let query = supabase
      .from("clientes")
      .select("*")
      .eq("user_id", ownerId);

    if (sedeId) {
        query = query.or(`sede_id.eq.${sedeId},sede_id.is.null`);
    }
    
    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
        console.error("Error fetching clients:", error);
        throw error;
    }
    return data as Client[];
};

const Clientes = () => {
  const { ownerId, selectedSede } = useSessionStore();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const { data: clients, isLoading, isError, error } = useQuery({
    queryKey: ['clients', ownerId, selectedSede?.id],
    queryFn: () => fetchClients(ownerId, selectedSede?.id || null),
    enabled: !!ownerId,
  });

  if (isError) {
    showError("Erro ao buscar clientes: " + error.message);
  }

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const lowercasedFilter = searchTerm.toLowerCase();
    return clients.filter(client =>
        client.name.toLowerCase().includes(lowercasedFilter) ||
        (client.email && client.email.toLowerCase().includes(lowercasedFilter)) ||
        (client.phone && client.phone.includes(lowercasedFilter))
    );
  }, [clients, searchTerm]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
        const { error } = await supabase.from("clientes").delete().eq("id", clientId);
        if (error) throw error;
    },
    onSuccess: () => {
        showSuccess("Cliente excluído com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['clients', ownerId, selectedSede?.id] });
    },
    onError: (error) => {
        console.error("Error deleting client:", error);
        showError("Erro ao excluir cliente: " + error.message);
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async (clientId: string) => {
        const { error } = await supabase.functions.invoke('send-team-invitation', {
            body: { clientId }
        });
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
        showSuccess("Convite enviado para o cliente!");
    },
    onError: (error) => {
        showError(`Erro ao convidar: ${error.message}`);
    }
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedClient(null);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
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
                    <CardDescription>Para gerenciar clientes, você precisa primeiro selecionar uma sede específica.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Use o seletor no menu lateral ou crie sua primeira sede.</p>
                    <Button asChild className="mt-4">
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full md:w-64 pl-10"
                />
            </div>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen);
              if (!isOpen) setSelectedClient(null);
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} disabled={!selectedSede}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{selectedClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                </DialogHeader>
                <ClientForm onSuccess={handleFormSuccess} client={selectedClient} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Clientes de {selectedSede?.name || 'Todas as Sedes'}</CardTitle>
            <CardDescription>Gerencie todos os clientes da sua barbearia.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : clients?.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="Nenhum cliente cadastrado"
                description="Sua lista de clientes está vazia. Adicione seu primeiro cliente para começar a agendar e gerenciar."
              >
                <Button onClick={handleAddNew}>Adicionar Primeiro Cliente</Button>
              </EmptyState>
            ) : filteredClients.length === 0 ? (
                <EmptyState
                    icon={<Search className="h-12 w-12" />}
                    title="Nenhum cliente encontrado"
                    description="Nenhum cliente corresponde à sua busca. Tente um termo diferente."
                />
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {paginatedClients.map((client) => (
                    <motion.div
                      key={client.id}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold">{client.name}</CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                    <MoreVertical className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(client)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!client.email}>
                                        <UserPlus className="mr-2 h-4 w-4" /> Convidar para Equipe
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Convidar {client.name} para a equipe?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Uma notificação será enviada para o usuário. Se ele aceitar, seu perfil será convertido para um perfil de barbeiro e ele será adicionado à sua equipe.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => inviteMutation.mutate(client.id)}>
                                          Sim, Enviar Convite
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente e seu histórico de agendamentos.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteMutation.mutate(client.id)} className="bg-destructive hover:bg-destructive/90">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground truncate">{client.email || "Sem email"}</p>
                            <p className="text-sm text-muted-foreground">{client.phone || "Sem telefone"}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage((prev) => Math.max(prev - 1, 1));
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="px-4 py-2 text-sm font-medium">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                                        }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Clientes;