import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Switch } from "../ui/switch";
import { allFeatures } from "@/lib/plans";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  feature_key: z.string().min(1, { message: "A chave do recurso é obrigatória." }),
  name: z.string().min(3, { message: "O nome é obrigatório." }),
  description: z.string().optional(),
  monthly_price: z.coerce.number().min(0, { message: "O preço não pode ser negativo." }),
  is_active: z.boolean().default(true),
});

export type Addon = {
  id: string;
  feature_key: string;
  name: string;
  description?: string | null;
  monthly_price: number;
  is_active: boolean;
};

type AddonFormProps = {
  onSuccess: () => void;
  addon?: Addon | null;
};

const AddonForm = ({ onSuccess, addon }: AddonFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feature_key: addon?.feature_key || "",
      name: addon?.name || "",
      description: addon?.description || "",
      monthly_price: addon?.monthly_price || 0,
      is_active: addon?.is_active ?? true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const toastId = showLoading(addon ? "Atualizando addon..." : "Criando addon...");

    let error;
    if (addon) {
      const { error: updateError } = await supabase.from("addons").update(values).eq("id", addon.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("addons").insert([values]);
      error = insertError;
    }

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar addon: ${error.message}`);
    } else {
      showSuccess(`Addon ${addon ? 'atualizado' : 'criado'} com sucesso!`);
      form.reset();
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="feature_key" render={({ field }) => (
          <FormItem>
            <FormLabel>Recurso</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o recurso" /></SelectTrigger></FormControl>
                <SelectContent>{allFeatures.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
            <FormDescription>Selecione a funcionalidade que este addon representa.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nome do Addon</FormLabel><FormControl><Input placeholder="Ex: Assistente de IA" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="monthly_price" render={({ field }) => (
          <FormItem><FormLabel>Preço Mensal (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="29.90" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Descreva o que este addon oferece." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="is_active" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Ativo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">{form.formState.isSubmitting ? "Salvando..." : "Salvar Addon"}</Button>
      </form>
    </Form>
  );
};

export default AddonForm;