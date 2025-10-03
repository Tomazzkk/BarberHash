import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError } from "@/utils/toast";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "../ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  price: z.coerce.number().positive({ message: "O preço deve ser um número positivo." }),
  duration_minutes: z.coerce.number().int().positive({ message: "A duração deve ser um número inteiro positivo." }),
  description: z.string().optional(),
  sinal_required: z.boolean().default(false),
  sinal_value: z.coerce.number().min(0, { message: "O valor do sinal não pode ser negativo." }),
}).refine(data => !data.sinal_required || data.sinal_value > 0, {
    message: "O valor do sinal deve ser maior que zero se for obrigatório.",
    path: ["sinal_value"],
});

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string | null;
  sinal_required?: boolean;
  sinal_value?: number;
};

type ServiceFormProps = {
  onSuccess: () => void;
  service?: Service | null;
};

const ServiceForm = ({ onSuccess, service }: ServiceFormProps) => {
  const { ownerId, selectedSede } = useSessionStore();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name || "",
      price: service?.price || undefined,
      duration_minutes: service?.duration_minutes || 30,
      description: service?.description || "",
      sinal_required: service?.sinal_required || false,
      sinal_value: service?.sinal_value || 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
        if (!ownerId) throw new Error("Você precisa estar logado.");
        if (!selectedSede) throw new Error("Nenhuma sede selecionada.");

        const serviceData = { ...values, user_id: ownerId, sede_id: selectedSede.id };

        if (service) {
            const { error } = await supabase.from("servicos").update(serviceData).eq("id", service.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from("servicos").insert([serviceData]);
            if (error) throw error;
        }
    },
    onSuccess: () => {
        showSuccess(`Serviço ${service ? 'atualizado' : 'adicionado'} com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ['services', selectedSede?.id] });
        form.reset();
        onSuccess();
    },
    onError: (error) => {
        showError(`Erro ao salvar serviço: ${error.message}`);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Serviço</FormLabel>
            <FormControl><Input placeholder="Ex: Corte de Cabelo" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl><Textarea placeholder="Descreva o serviço, o que está incluso, etc." {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem>
            <FormLabel>Preço (R$)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="Ex: 40.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="duration_minutes" render={({ field }) => (
          <FormItem>
            <FormLabel>Duração (minutos)</FormLabel>
            <FormControl><Input type="number" placeholder="Ex: 30" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField
            control={form.control}
            name="sinal_required"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Exigir Sinal</FormLabel>
                        <FormDescription>
                            Cobrar um valor adiantado para este serviço.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                </FormItem>
            )}
        />
        {form.watch("sinal_required") && (
            <FormField
                control={form.control}
                name="sinal_value"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor do Sinal (R$)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="Ex: 10.00" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Salvando..." : "Salvar Serviço"}
        </Button>
      </form>
    </Form>
  );
};

export default ServiceForm;