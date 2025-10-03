import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { availableIcons } from "@/lib/icons";
import { useSessionStore } from "@/hooks/useSessionStore";

const formSchema = z.object({
  label: z.string().min(3, { message: "O nome do benefício é obrigatório." }),
  description: z.string().optional(),
  icon: z.string().min(1, { message: "Selecione um ícone." }),
});

export type PlanBenefit = {
  id: string;
  label: string;
  description: string | null;
  icon: string;
};

type PlanBenefitFormProps = {
  onSuccess: () => void;
  benefit?: PlanBenefit | null;
};

const PlanBenefitForm = ({ onSuccess, benefit }: PlanBenefitFormProps) => {
  const queryClient = useQueryClient();
  const { user } = useSessionStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: benefit?.label || "",
      description: benefit?.description || "",
      icon: benefit?.icon || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const benefitData = { ...values, owner_user_id: user.id };

      if (benefit) {
        const { error } = await supabase.from("plan_benefits").update(benefitData).eq("id", benefit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plan_benefits").insert([benefitData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(`Benefício ${benefit ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['plan_benefits'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Erro detalhado ao salvar benefício:", error);
      showError(`Erro ao salvar: ${error.message || 'Ocorreu um erro desconhecido. Verifique as permissões do banco de dados.'}`);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField control={form.control} name="label" render={({ field }) => (
          <FormItem><FormLabel>Nome do Benefício</FormLabel><FormControl><Input placeholder="Ex: Desconto em Produtos" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o que este benefício oferece ao cliente." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="icon" render={({ field }) => (
          <FormItem><FormLabel>Ícone</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um ícone" /></SelectTrigger></FormControl><SelectContent>{availableIcons.map(icon => (<SelectItem key={icon.id} value={icon.id}><div className="flex items-center gap-2"><icon.icon className="h-4 w-4" /> {icon.label}</div></SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={mutation.isPending} className="w-full">{mutation.isPending ? "Salvando..." : "Salvar Benefício"}</Button>
      </form>
    </Form>
  );
};

export default PlanBenefitForm;