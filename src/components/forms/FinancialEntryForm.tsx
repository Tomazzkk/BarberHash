import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError } from "@/utils/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  descricao: z.string().min(2, { message: "A descrição é obrigatória." }),
  valor: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  tipo: z.enum(["entrada", "saida"], { required_error: "O tipo é obrigatório." }),
});

export type FinancialEntry = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  data: string;
};

type FinancialEntryFormProps = {
  onSuccess: () => void;
  entry?: FinancialEntry | null;
  sedeId: string;
};

const FinancialEntryForm = ({ onSuccess, entry, sedeId }: FinancialEntryFormProps) => {
  const ownerId = useSessionStore((state) => state.ownerId);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: entry?.descricao || "",
      valor: entry?.valor || 0,
      tipo: entry?.tipo || "entrada",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
        if (!ownerId) throw new Error("Você precisa estar logado.");

        const entryData = {
            ...values,
            user_id: ownerId,
            sede_id: sedeId,
        };

        if (entry) {
            const { error } = await supabase.from("financeiro").update(entryData).eq("id", entry.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from("financeiro").insert([entryData]);
            if (error) throw error;
        }
    },
    onSuccess: () => {
        showSuccess(`Lançamento ${entry ? 'atualizado' : 'adicionado'} com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
        form.reset();
        onSuccess();
    },
    onError: (error: any) => {
        showError(`Erro ao salvar lançamento: ${error.message}`);
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="descricao" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Textarea placeholder="Ex: Compra de produtos" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="valor" render={({ field }) => (
          <FormItem>
            <FormLabel>Valor (R$)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="50,00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tipo" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </form>
    </Form>
  );
};

export default FinancialEntryForm;