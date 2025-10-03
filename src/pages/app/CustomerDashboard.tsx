import { useSessionStore } from "@/hooks/useSessionStore";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bell, Star, Heart, Calendar, Award, MapPin } from "lucide-react";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/utils/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getDistance } from "@/utils/location";
import { Badge } from "@/components/ui/badge";
import FeaturedProductsCarousel from "@/components/app/FeaturedProductsCarousel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationPopover from "@/components/app/NotificationPopover";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

type Barber = {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    rating: number;
};

type Product = {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
};

type Sede = {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    image_url: string | null;
    is_matriz: boolean;
};

type SedeWithDistance = Sede & { distance: number };

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const CustomerDashboard = () => {
    const { user, profile, config, originalProfile, selectedSede } = useSessionStore();
    const [topBarber, setTopBarber] = React.useState<Barber | null>(null);
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const unreadCount = useUnreadNotifications();

    React.useEffect(() => {
        const fetchSedeSpecificData = async () => {
            if (!config || !selectedSede) {
                setTopBarber(null);
                setProducts([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [barbersRes, productsRes] = await Promise.all([
                    supabase.from('barbeiros').select('id, name, avatar_url, bio').eq('user_id', config.user_id).eq('sede_id', selectedSede.id).limit(1),
                    supabase.from('produtos').select('id, name, price, image_url').eq('user_id', config.user_id).eq('is_featured', true).eq('sede_id', selectedSede.id)
                ]);

                if (barbersRes.data && barbersRes.data.length > 0) {
                    setTopBarber({ ...barbersRes.data[0], rating: 4.9 });
                } else {
                    setTopBarber(null);
                }
                setProducts(productsRes.data || []);
            } catch (error) {
                console.error("Error fetching sede data:", error);
                showError("Erro ao carregar dados da unidade.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchSedeSpecificData();
    }, [selectedSede, config]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-24" /></div></div><Skeleton className="h-8 w-8 rounded-full" /></div>
                <Skeleton className="h-12 w-full rounded-full" />
                <div className="space-y-4">
                    <Skeleton className="h-36 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        )
    }

    if (!loading && !selectedSede) {
        return (
            <div className="p-4 text-center flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
                <div className="inline-block p-4 bg-muted rounded-full mb-4">
                    <MapPin className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Nenhuma unidade encontrada</h1>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Esta barbearia ainda não cadastrou suas unidades. Por favor, volte mais tarde!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-foreground">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary"><AvatarImage src={getAvatarUrl(profile?.full_name, profile?.avatar_url)} /><AvatarFallback>{getInitials(profile?.full_name || '..')}</AvatarFallback></Avatar>
                    <div><p className="text-sm text-muted-foreground">Bem-vindo</p><h1 className="text-lg font-bold">Olá, {profile?.full_name?.split(' ')[0] || 'Cliente'}</h1></div>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-6 w-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                        <NotificationPopover />
                    </PopoverContent>
                </Popover>
            </header>

            <div className="w-full flex items-center justify-center gap-2 text-lg font-semibold text-foreground h-12 rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{selectedSede ? selectedSede.name : "Nenhuma unidade disponível"}</span>
            </div>

            <section className="space-y-4">
                <Card className="bg-muted/50 p-6 text-center">
                    <h2 className="text-xl font-bold">Seu próximo corte perfeito</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Agende com os melhores barbeiros da cidade</p>
                    <Button asChild size="lg" disabled={!selectedSede}>
                        <Link to="/app/agendar" state={{ sedeId: selectedSede?.id }}>Agendar Agora</Link>
                    </Button>
                </Card>
                <div className={cn("grid gap-4", config?.plan_feature_enabled ? "grid-cols-2" : "grid-cols-1")}>
                    <Card asChild className="hover:bg-muted/80 transition-colors">
                        <Link to="/app/agendar" state={{ sedeId: selectedSede?.id }} className={cn("flex flex-col items-center justify-center p-4 text-center h-28", !selectedSede && "pointer-events-none opacity-50")}>
                            <Calendar className="h-8 w-8 mb-2 text-primary" />
                            <p className="font-semibold">Agendar</p>
                        </Link>
                    </Card>
                    {config?.plan_feature_enabled && (
                        <Card asChild className="hover:bg-muted/80 transition-colors">
                            <Link to="/app/planos" className="flex flex-col items-center justify-center p-4 text-center h-28">
                                <Award className="h-8 w-8 mb-2 text-primary" />
                                <p className="font-semibold">Planos VIP</p>
                            </Link>
                        </Card>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-3">Produtos em Destaque</h2>
                <FeaturedProductsCarousel products={products} />
            </section>

            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold">Barbeiro em Destaque</h2>
                </div>
                {topBarber ? (
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14">
                                    <AvatarImage src={getAvatarUrl(topBarber.name, topBarber.avatar_url)} />
                                    <AvatarFallback>{getInitials(topBarber.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold">{topBarber.name}</h3>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Star className="h-4 w-4 text-primary fill-primary" />
                                        <span className="font-semibold">{topBarber.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
                                <Link to={`/barbeiro/${topBarber.id}`}>Ver Perfil</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-muted/50">
                        <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                            <Heart className="h-8 w-8" />
                            <p className="font-medium">Nenhum barbeiro cadastrado</p>
                            <p className="text-sm">Assim que um profissional for adicionado, ele aparecerá aqui.</p>
                        </CardContent>
                    </Card>
                )}
            </section>

            {selectedSede && (
                <section>
                    <h2 className="text-xl font-bold mb-3">{selectedSede.is_matriz ? "Unidade Principal" : "Unidade Selecionada"}</h2>
                    <Card className="overflow-hidden relative"><img src={selectedSede.image_url || "/assets/dashboard-hero.jpg"} alt={selectedSede.name} className="w-full h-32 object-cover" /><div className="absolute top-2 right-2 flex gap-2"><Badge variant="secondary" className="flex items-center gap-1"><Star className="h-3 w-3" /> 4.8</Badge><Button variant="secondary" size="icon" className="h-8 w-8 rounded-full"><Heart className="h-4 w-4" /></Button></div><CardContent className="p-4 bg-background"><h3 className="font-bold text-lg">{selectedSede.name}</h3><p className="text-sm text-muted-foreground">{selectedSede.address || 'Endereço não disponível'}</p><Button className="w-full mt-4" asChild size="lg"><Link to="/app/agendar" state={{ sedeId: selectedSede.id }}>Agendar Agora</Link></Button></CardContent></Card>
                </section>
            )}
        </div>
    );
};

export default CustomerDashboard;