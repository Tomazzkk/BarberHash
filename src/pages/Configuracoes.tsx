import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/forms/ProfileForm";
import TrainingModeManager from "@/components/TrainingModeManager";
import { useSessionStore } from "@/hooks/useSessionStore";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeSelector from "@/components/ThemeSelector";
import MercadoPagoForm from "@/components/forms/MercadoPagoForm";

const Configuracoes = () => {
  const { profile } = useSessionStore();
  const navigate = useNavigate();
  const isOwner = profile?.role === 'dono';
  const isManagerOrAdmin = profile?.role === 'admin' || profile?.role === 'gerente';
  const isBarberOrSupervisor = profile?.role === 'barbeiro' || profile?.role === 'supervisor';
  const isClient = profile?.role === 'cliente_final';

  // Client View
  if (isClient) {
    return (
      <div className="space-y-6">
        <header className="flex items-center justify-center relative">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute left-0">
            <ArrowLeft />
          </Button>
          <h1 className="text-lg font-bold">Editar Perfil</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Suas Informações</CardTitle>
            <CardDescription>
              Mantenha seus dados atualizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Barber or Supervisor View
  if (isBarberOrSupervisor) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <Card>
          <CardHeader>
            <CardTitle>Suas Informações</CardTitle>
            <CardDescription>
              Mantenha seus dados de perfil e foto atualizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Owner, Admin, Manager View
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <Tabs defaultValue="profile">
        <TabsList className={cn("grid w-full", isOwner ? "grid-cols-4" : "grid-cols-2")}>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {isOwner && (
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          )}
          {(isOwner || isManagerOrAdmin) && (
            <TabsTrigger value="system">Sistema</TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Gerencie as informações da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileForm />
            </CardContent>
          </Card>
        </TabsContent>
        {isOwner && (
          <TabsContent value="appearance">
            <ThemeSelector />
          </TabsContent>
        )}
        {(isOwner || isManagerOrAdmin) && (
            <TabsContent value="system">
                <div className="space-y-6">
                    <TrainingModeManager />
                </div>
            </TabsContent>
        )}
        {isOwner && (
            <TabsContent value="integrations">
                <MercadoPagoForm />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Configuracoes;