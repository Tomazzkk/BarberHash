import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical, Users, UserCog } from "lucide-react";
import { useSessionStore, ProfileRole } from "@/hooks/useSessionStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarUrl } from "@/utils/avatar";
import EmptyState from "@/components/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ChangeRoleForm from "@/components/forms/ChangeRoleForm";
import { Link } from "react-router-dom";

type TeamMember = {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  avatar_url: string | null;
  users: {
    email: string;
    last_sign_in_at: string | null;
  } | null;
};

const roleNames: Record<ProfileRole, string> = {
    admin: 'Admin',
    dono: 'Dono',
    barbeiro: 'Barbeiro',
    cliente_final: 'Cliente',
    gerente: 'Gerente',
    supervisor: 'Supervisor'
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const Equipe = () => {
  const user = useSessionStore((state) => state.user);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', user?.id],
    queryFn: async () => {
        if (!user) return [];
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, role, avatar_url, users(email, last_sign_in_at)")
            .eq("owner_id", user.id)
            .order("full_name");
        if (error) {
            showError("Erro ao buscar equipe: " + error.message);
            throw error;
        }
        return data as TeamMember[];
    },
    enabled: !!user,
  });

  const handleRoleFormSuccess = () => {
    setIsRoleFormOpen(false);
    setSelectedMember(null);
  };

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    setIsRoleFormOpen(true);
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Equipe</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Membros da Equipe</CardTitle>
            <CardDescription>
              Gerencie os usuários com acesso ao seu sistema. Para adicionar novos membros, eles devem primeiro se cadastrar no app e então você pode promovê-los na página de <Link to="/clientes" className="text-primary underline">Clientes</Link>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
              </div>
            ) : team?.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="Nenhum membro na equipe"
                description="Quando um cliente for promovido a um cargo na equipe, ele aparecerá aqui."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team?.map((member) => (
                  <Card key={member.id} className="p-4 flex flex-col items-center text-center relative">
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditRole(member)}>
                                    <UserCog className="mr-2 h-4 w-4" /> Alterar Cargo
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Avatar className="h-20 w-20 text-2xl mb-4">
                      <AvatarImage src={getAvatarUrl(member.full_name, member.avatar_url)} />
                      <AvatarFallback>{getInitials(member.full_name || '??')}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-lg">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.users?.email}</p>
                    <Badge variant="outline" className="mt-2">{roleNames[member.role]}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isRoleFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedMember(null); setIsRoleFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Alterar Cargo de {selectedMember?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedMember && <ChangeRoleForm onSuccess={handleRoleFormSuccess} member={selectedMember} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Equipe;