import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/hooks/useSessionStore";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import OnboardingModal from "../OnboardingModal";
import Breadcrumbs from "./Breadcrumbs";
import WhatsNewModal from "../WhatsNewModal";
import { APP_VERSION, changelogData } from "@/lib/changelog";
import { motion } from "framer-motion";
import CommandPalette from "../CommandPalette";

const MainLayout = () => {
    const { trainingModeActive, profile } = useSessionStore();
    const [onboardingSteps, setOnboardingSteps] = useState<any[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(false);
    const [openCommandPalette, setOpenCommandPalette] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpenCommandPalette((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            if (profile?.role !== 'dono') return;

            if (sessionStorage.getItem('onboardingDismissed') === 'true') {
                return;
            }

            const { count: sedesCount } = await supabase.from('sedes').select('*', { count: 'exact', head: true });
            const { count: barbersCount } = await supabase.from('barbeiros').select('*', { count: 'exact', head: true });
            const { count: servicesCount } = await supabase.from('servicos').select('*', { count: 'exact', head: true });

            const hasSedes = (sedesCount || 0) > 0;
            const hasBarbers = (barbersCount || 0) > 0;
            const hasServices = (servicesCount || 0) > 0;

            const steps = [
                { isCompleted: hasSedes, title: "Crie sua primeira Sede", description: "Cadastre a unidade principal da sua barbearia.", link: "/sedes" },
                { isCompleted: hasBarbers, title: "Cadastre um Barbeiro", description: "Adicione os profissionais da sua equipe.", link: "/barbeiros" },
                { isCompleted: hasServices, title: "Adicione um Serviço", description: "Defina os serviços que você oferece, com preços e durações.", link: "/servicos" },
            ];
            setOnboardingSteps(steps);

            if (!hasSedes || !hasBarbers || !hasServices) {
                setShowOnboarding(true);
            }
        };

        const checkAppVersion = () => {
            const lastSeenVersion = localStorage.getItem('appVersion');
            if (lastSeenVersion !== APP_VERSION) {
                setShowWhatsNew(true);
            }
        };

        checkOnboardingStatus();
        checkAppVersion();
    }, [profile]);

    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
        sessionStorage.setItem('onboardingDismissed', 'true');
    };

    const handleCloseWhatsNew = () => {
        setShowWhatsNew(false);
        localStorage.setItem('appVersion', APP_VERSION);
    };

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <OnboardingModal steps={onboardingSteps} isOpen={showOnboarding} onClose={handleCloseOnboarding} />
            <WhatsNewModal isOpen={showWhatsNew} onClose={handleCloseWhatsNew} latestChanges={changelogData[0]} />
            <CommandPalette open={openCommandPalette} setOpen={setOpenCommandPalette} />
            <div className="hidden border-r bg-muted/40 md:block print-hidden">
                <Sidebar />
            </div>
            <div className="flex flex-col">
                {trainingModeActive && (
                    <div className="bg-yellow-400 text-center py-2 px-4 text-sm font-semibold text-yellow-900 flex items-center justify-center gap-2 print-hidden">
                        <FlaskConical className="h-4 w-4" />
                        Você está no Modo de Treinamento. Os dados de exemplo serão removidos ao desativar.
                    </div>
                )}
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 print-hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                    <Breadcrumbs />
                    <div className="w-full flex-1 flex justify-end">
                        <div className="relative w-full max-w-sm" onClick={() => setOpenCommandPalette(true)}>
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Buscar... (⌘K)" className="w-full appearance-none bg-background pl-8 shadow-none" readOnly />
                        </div>
                    </div>
                </header>
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40"
                >
                    <Outlet />
                </motion.main>
            </div>
        </div>
    );
};

export default MainLayout;