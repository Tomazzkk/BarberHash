import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError } from "@/utils/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type ClientFormProps = {
  onSuccess: () => void;
  client?: Client | null;
};

const ClientForm = ({ onSuccess, client }: ClientFormProps) => {
  const { ownerId, selectedSede } = useSessionStore();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      notes: client?.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
        if (!ownerId) throw new Error("Você precisa estar logado.");
        if (!selectedSede) throw new Error("Para adicionar um cliente, por favor, selecione uma sede específica no menu lateral.");

        const clientData = { ...values, user_id: ownerId, sede_id: selectedSede.id };

        if (client) {
            const { error } = await supabase.from("clientes").update(clientData).eq("id", client.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from("clientes").insert([clientData]);
            if (error) throw error;
        }
    },
    onSuccess: () => {
        showSuccess(`Cliente ${client ? 'atualizado' : 'adicionado'} com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ['clients', ownerId] });
        form.reset();
        onSuccess();
    },
    onError: (error) => {
        console.error("Error saving client:", error);
        showError(`Erro ao salvar cliente: ${error.message}`);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email (Opcional)</FormLabel>
            <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone (Opcional)</FormLabel>
            <FormControl><Input placeholder="(99) 99999-9999" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Observações (Opcional)</FormLabel>
            <FormControl><Textarea placeholder="Preferências do cliente, etc." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Salvando..." : "Salvar Cliente"}
        </Button>
      </form>
    </Form>
  );
};

export default ClientForm;