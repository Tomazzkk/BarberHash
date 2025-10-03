import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";

const formSchema = z.object({
  pode_ver_agenda_completa: z.boolean().default(false),
  pode_ver_financeiro_completo: z.boolean().default(false),
  pode_editar_servicos: z.boolean().default(false),
  pode_gerenciar_clientes: z.boolean().default(false),
});

type PermissionsFormValues = z.infer<typeof formSchema>;

type Barber = {
  id: string;
  name: string;
};

type PermissionsFormProps = {
  onSuccess: () => void;
  barber: Barber;
};

const permissionItems = [
    { name: "pode_ver_agenda_completa", label: "Ver Agenda Completa", description: "Permite ver a agenda de todos os barbeiros, não apenas a sua." },
    { name: "pode_ver_financeiro_completo", label: "Ver Financeiro", description: "Permite acesso à tela de finanças da barbearia." },
    { name: "pode_editar_servicos", label: "Gerenciar Serviços", description: "Permite criar, editar e excluir os serviços oferecidos." },
    { name: "pode_gerenciar_clientes", label: "Gerenciar Clientes e Relatórios", description: "Permite acesso às telas de clientes e relatórios." },
] as const;


const PermissionsForm = ({ onSuccess, barber }: PermissionsFormProps) => {
  const user = useSessionStore((state) => state.user);
  const form = useForm<PermissionsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        pode_ver_agenda_completa: false,
        pode_ver_financeiro_completo: false,
        pode_editar_servicos: false,
        pode_gerenciar_clientes: false,
    },
  });

  useEffect(() => {
    const fetchPermissions = async () => {
        const { data } = await supabase
            .from("barbeiro_permissoes")
            .select("*")
            .eq("barbeiro_id", barber.id)
            .single();
        if (data) {
            form.reset(data);
        }
    }
    fetchPermissions();
  }, [barber.id, form]);

  async function onSubmit(values: PermissionsFormValues) {
    if (!user) {
      showError("Você precisa estar logado.");
      return;
    }

    const toastId = showLoading("Salvando permissões...");

    const permissionsData = {
      ...values,
      barbeiro_id: barber.id,
      user_id: user.id,
    };

    const { error } = await supabase.from("barbeiro_permissoes").upsert(permissionsData, { onConflict: 'barbeiro_id' });

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar permissões: ${error.message}`);
    } else {
      showSuccess(`Permissões de ${barber.name} atualizadas!`);
      onSuccess();
    }
  }

  if (form.formState.isLoading) {
    return <div className="space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {permissionItems.map((item) => (
            <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>{item.label}</FormLabel>
                            <FormDescription>{item.description}</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        ))}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Permissões"}
        </Button>
      </form>
    </Form>
  );
};

export default PermissionsForm;