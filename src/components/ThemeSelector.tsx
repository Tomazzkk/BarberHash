import { useState } from 'react';
import { useSessionStore } from '@/hooks/useSessionStore';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { useTheme } from 'next-themes';

const themes = [
  { name: 'dark', label: 'Padrão Escuro', colors: ['#0A0A0A', '#FBBF24'] },
  { name: 'light', label: 'Claro', colors: ['#FFFFFF', '#3B82F6'] },
  { name: 'vintage', label: 'Vintage', colors: ['#F5EFE6', '#8C5A3B'] },
  { name: 'crimson', label: 'Carmesim', colors: ['#1F1F1F', '#DC2626'] },
];

const ThemeSelector = () => {
    const { config, user, fetchSessionData, session } = useSessionStore();
    const { setTheme } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState(config?.theme || 'dark');
    const [isSaving, setIsSaving] = useState(false);

    const handleSelectTheme = (themeName: string) => {
        setSelectedTheme(themeName);
        setTheme(themeName); // Preview the theme immediately
    };

    const handleSaveChanges = async () => {
        if (!user) {
            showError("Não foi possível salvar. Tente novamente.");
            return;
        }
        setIsSaving(true);
        const toastId = showLoading("Salvando tema...");

        const { error } = await supabase
            .from('config_cliente')
            .upsert({ user_id: user.id, theme: selectedTheme }, { onConflict: 'user_id' });

        dismissToast(toastId);
        if (error) {
            showError(`Erro ao salvar: ${error.message}`);
            // Revert to original theme on error
            setTheme(config?.theme || 'dark');
        } else {
            showSuccess("Tema salvo com sucesso!");
            // Refetch session data to update the config in the store permanently
            if (session) {
                fetchSessionData(session);
            }
        }
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Aparência do Sistema</CardTitle>
                <CardDescription>
                    Escolha um tema visual para personalizar a aparência do seu sistema. A mudança é aplicada para todos os membros da sua equipe.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {themes.map((theme) => (
                        <div
                            key={theme.name}
                            onClick={() => handleSelectTheme(theme.name)}
                            className={cn(
                                "cursor-pointer rounded-lg border-2 p-2 transition-all relative",
                                selectedTheme === theme.name ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                            )}
                        >
                            <div className="aspect-video w-full rounded-md overflow-hidden flex">
                                <div style={{ backgroundColor: theme.colors[0] }} className="w-1/2 h-full" />
                                <div style={{ backgroundColor: theme.colors[1] }} className="w-1/2 h-full" />
                            </div>
                            <p className="text-center text-sm font-medium mt-2">{theme.label}</p>
                            {selectedTheme === theme.name && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                    <CheckCircle className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving || selectedTheme === config?.theme}>
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ThemeSelector;