import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Plan } from "@/pages/PlanManagement";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionStore } from "@/hooks/useSessionStore";
import { useQuery } from "@tanstack/react-query";
import { PlanBenefit } from "./PlanBenefitForm";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome do plano é obrigatório." }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, { message: "O preço não pode ser negativo." }),
  is_active: z.boolean().default(true),
  is_popular: z.boolean().default(false),
  features: z.array(z.string()).optional(),
});

type PlanFormProps = {
  onSuccess: () => void;
  plan?: Plan | null;
};

const PlanForm = ({ onSuccess, plan }: PlanFormProps) => {
  const { user } = useSessionStore();
  const { data: benefits = [] } = useQuery<PlanBenefit[]>({
    queryKey: ['plan_benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_benefits").select("*").order("label");
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: plan?.name || "",
      description: plan?.description || "",
      price: plan?.price || 0,
      is_active: plan?.is_active ?? true,
      is_popular: plan?.is_popular || false,
      features: plan?.features || [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para gerenciar planos.");
      return;
    }
    const toastId = showLoading(plan ? "Atualizando plano..." : "Adicionando plano...");

    const planData = {
      name: values.name,
      description: values.description,
      price: values.price,
      is_active: values.is_active,
      is_popular: values.is_popular,
      features: values.features || [],
      owner_user_id: user.id, // <-- Adicionado o ID do dono
    };

    let error;
    if (plan) {
      const { error: updateError } = await supabase
        .from("planos")
        .update(planData)
        .eq("id", plan.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("planos").insert([planData]);
      error = insertError;
    }

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar plano: ${error.message}`);
    } else {
      showSuccess(`Plano ${plan ? 'atualizado' : 'adicionado'} com sucesso!`);
      form.reset();
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome do Plano</FormLabel><FormControl><Input placeholder="Ex: Plano Essencial" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Preço Mensal (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="99.90" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Uma breve descrição do plano e seu público-alvo." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Ativo</FormLabel><FormDescription>Planos inativos não aparecerão para os clientes.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="is_popular" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Popular</FormLabel><FormDescription>Destacar este plano como o mais popular.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
                
                <Separator />

                <div>
                    <h3 className="mb-4 text-lg font-medium">Benefícios do Plano</h3>
                    <div className="space-y-4">
                        {benefits.map((benefit) => (
                            <FormField
                                key={benefit.id}
                                control={form.control}
                                name="features"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>{benefit.label}</FormLabel>
                                            <FormDescription>{benefit.description}</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={Array.isArray(field.value) && field.value.includes(benefit.id)}
                                                onCheckedChange={(checked) => {
                                                    const currentFeatures = Array.isArray(field.value) ? field.value : [];
                                                    return checked
                                                        ? field.onChange([...currentFeatures, benefit.id])
                                                        : field.onChange(currentFeatures.filter((value) => value !== benefit.id));
                                                }}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full mt-6">
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Plano"}
        </Button>
      </form>
    </Form>
  );
};

export default PlanForm;