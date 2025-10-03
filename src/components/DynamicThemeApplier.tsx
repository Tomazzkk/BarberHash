import { useSessionStore } from "@/hooks/useSessionStore";
import { useEffect } from "react";
import { useTheme } from "next-themes";

const DynamicThemeApplier = ({ children }: { children: React.ReactNode }) => {
    const { config, loading, profile } = useSessionStore();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (loading) return;

        const isStaff = profile && ['dono', 'admin', 'gerente', 'supervisor', 'barbeiro'].includes(profile.role);

        if (isStaff) {
            // Para a equipe, aplica o tema da configuração da barbearia
            if (config?.theme) {
                setTheme(config.theme);
            } else {
                setTheme('dark'); // Tema padrão para a equipe se nenhum for definido
            }
        } else {
            // Para clientes ou usuários não logados, usa sempre o tema padrão escuro
            setTheme('dark');
        }
    }, [config, loading, profile, setTheme]);

    return <>{children}</>;
}

export default DynamicThemeApplier;