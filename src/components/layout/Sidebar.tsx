import { LogOut, User, ChevronsUpDown, Settings, Users2, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSessionStore, ProfileRole } from "@/hooks/useSessionStore";
import Navigation from "./Navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import SedeSelector from "./SedeSelector";
import Logo from "../Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, profile, config, logout, originalProfile, setSimulatedRole } = useSessionStore();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleViewChange = (role: ProfileRole | null) => {
        setSimulatedRole(role, () => {
            if (role === 'cliente_final') {
                navigate('/app/home', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        });
    };

    // Enabled for all roles for development purposes
    const isPrivilegedUser = true;

    return (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                {config?.logo_url ? (
                    <img src={config.logo_url} alt="Logo" className="h-8 w-auto" />
                ) : (
                    <Logo />
                )}
            </div>
            <div className="px-2 lg:px-4 py-2 border-b">
                <SedeSelector />
            </div>
            <div className="flex-1">
                <Navigation />
            </div>
            <div className="mt-auto p-4 border-t">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start h-auto px-2 py-2 text-left">
                            <div className="flex items-center w-full">
                                <Avatar className="h-10 w-10 border mr-3 shrink-0">
                                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                                    <AvatarFallback>{getInitials(profile?.full_name || user?.email || 'U')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {profile?.full_name || user?.email?.split('@')[0]}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                </div>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isPrivilegedUser && (
                            <>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Users2 className="mr-2 h-4 w-4" />
                                        <span>Alterar Visão</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem onClick={() => handleViewChange('dono')}>Dono da Barbearia</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleViewChange('barbeiro')}>Barbeiro</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleViewChange('cliente_final')}>Cliente Final</DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                {originalProfile && (
                                    <DropdownMenuItem onClick={() => handleViewChange(null)}>
                                        <Repeat className="mr-2 h-4 w-4" />
                                        <span>Restaurar Visão Original</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default Sidebar;