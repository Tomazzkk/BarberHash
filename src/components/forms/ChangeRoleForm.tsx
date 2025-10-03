import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileRole } from "@/hooks/useSessionStore";

const formSchema = z.object({
  role: z.enum(["barbeiro", "supervisor", "gerente"]),
});

type TeamMember = {
  id: string;
  full_name: string | null;
  role: ProfileRole;
};

type ChangeRoleFormProps = {
  onSuccess: () => void;
  member: TeamMember;
};

const roleOptions = [
    { value: 'barbeiro', label: 'Barbeiro' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'gerente', label: 'Gerente' },
];

const ChangeRoleForm = ({ onSuccess, member }: ChangeRoleFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: member.role as 'barbeiro' | 'supervisor' | 'gerente' | undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
        const { error } = await supabase
          .from("profiles")
          .update({ role: values.role })
          .eq("id", member.id);
        if (error) throw error;
    },
    onSuccess: () => {
        showSuccess(`Cargo de ${member.full_name} atualizado com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ['team'] });
        onSuccess();
    },
    onError: (error: any) => {
        showError(`Erro ao atualizar cargo: ${error.message}`);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormLabel>Novo Cargo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {roleOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </Form>
  );
};

export default ChangeRoleForm;