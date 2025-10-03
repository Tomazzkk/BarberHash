import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Switch } from "../ui/switch";
import { DateRange } from "react-day-picker";

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da promoção é obrigatório." }),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive({ message: "O valor do desconto deve ser positivo." }),
  date_range: z.object({
    from: z.date({ required_error: "A data de início é obrigatória." }),
    to: z.date({ required_error: "A data de término é obrigatória." }),
  }),
  is_active: z.boolean().default(true),
});

export type Promocao = {
  id: string;
  name: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

type PromocaoFormProps = {
  onSuccess: () => void;
  promocao?: Promocao | null;
  sedeId: string;
};

const PromocaoForm = ({ onSuccess, promocao, sedeId }: PromocaoFormProps) => {
  const ownerId = useSessionStore((state) => state.ownerId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: promocao?.name || "",
      description: promocao?.description || "",
      discount_type: promocao?.discount_type || "percentage",
      discount_value: promocao?.discount_value || 0,
      date_range: {
        from: promocao ? new Date(promocao.start_date) : new Date(),
        to: promocao ? new Date(promocao.end_date) : new Date(),
      },
      is_active: promocao?.is_active ?? true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!ownerId) {
      showError("Você precisa estar logado como dono ou membro da equipe.");
      return;
    }

    const toastId = showLoading(promocao ? "Atualizando promoção..." : "Criando promoção...");

    const promocaoData = {
      name: values.name,
      description: values.description,
      discount_type: values.discount_type,
      discount_value: values.discount_value,
      start_date: values.date_range.from.toISOString(),
      end_date: values.date_range.to.toISOString(),
      is_active: values.is_active,
      user_id: ownerId,
      sede_id: sedeId,
    };

    let result;
    if (promocao) {
      result = await supabase.from("promocoes").update(promocaoData).eq("id", promocao.id).select().single();
    } else {
      result = await supabase.from("promocoes").insert([promocaoData]).select().single();
    }

    dismissToast(toastId);

    if (result.error) {
      showError(`Erro ao salvar promoção: ${result.error.message}`);
    } else {
      showSuccess(`Promoção ${promocao ? 'atualizada' : 'criada'} com sucesso!`);
      
      if (values.is_active) {
        const { error: notificationError } = await supabase.functions.invoke('notify-promotion', {
          body: { promotion_id: result.data.id }
        });
        if (notificationError) {
          console.error("Erro ao criar notificações:", notificationError);
          showError("Promoção salva, mas falha ao notificar clientes.");
        }
      }

      form.reset();
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nome da Promoção</FormLabel><FormControl><Input placeholder="Ex: Semana da Barba" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="discount_type" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Desconto</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="percentage">Porcentagem (%)</SelectItem><SelectItem value="fixed">Valor Fixo (R$)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="discount_value" render={({ field }) => (
                <FormItem><FormLabel>Valor do Desconto</FormLabel><FormControl><Input type="number" step="0.01" placeholder={form.getValues("discount_type") === 'percentage' ? "20" : "10.00"} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="date_range" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>Período da Promoção</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "dd/MM/y")} - {format(field.value.to, "dd/MM/y")}</>) : (format(field.value.from, "dd/MM/y"))) : (<span>Selecione o período</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value as DateRange} onSelect={field.onChange} numberOfMonths={2} locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes da promoção, regras, etc." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="is_active" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Ativa</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">{form.formState.isSubmitting ? "Salvando..." : "Salvar Promoção"}</Button>
      </form>
    </Form>
  );
};

export default PromocaoForm;