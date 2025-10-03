import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Switch } from "../ui/switch";

const formSchema = z.object({
  code: z.string().min(3, { message: "O código deve ter pelo menos 3 caracteres." }).transform(val => val.toUpperCase()),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive({ message: "O valor do desconto deve ser positivo." }),
  is_active: z.boolean().default(true),
  expires_at: z.date().optional().nullable(),
  max_redemptions: z.coerce.number().int().positive().optional().nullable(),
});

export type Coupon = {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  expires_at?: string | null;
  max_redemptions?: number | null;
  times_redeemed: number;
};

type CouponFormProps = {
  onSuccess: () => void;
  coupon?: Coupon | null;
};

const CouponForm = ({ onSuccess, coupon }: CouponFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: coupon?.code || "",
      discount_type: coupon?.discount_type || "percentage",
      discount_value: coupon?.discount_value || 0,
      is_active: coupon?.is_active ?? true,
      expires_at: coupon?.expires_at ? new Date(coupon.expires_at) : null,
      max_redemptions: coupon?.max_redemptions || null,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const toastId = showLoading(coupon ? "Atualizando cupom..." : "Criando cupom...");

    const couponData = {
      ...values,
      expires_at: values.expires_at ? values.expires_at.toISOString() : null,
    };

    let error;
    if (coupon) {
      const { error: updateError } = await supabase.from("coupons").update(couponData).eq("id", coupon.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("coupons").insert([couponData]);
      error = insertError;
    }

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar cupom: ${error.message}`);
    } else {
      showSuccess(`Cupom ${coupon ? 'atualizado' : 'criado'} com sucesso!`);
      form.reset();
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="code" render={({ field }) => (
          <FormItem><FormLabel>Código do Cupom</FormLabel><FormControl><Input placeholder="EX: BEMVINDO10" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="discount_type" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="percentage">Porcentagem (%)</SelectItem><SelectItem value="fixed">Valor Fixo (R$)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="discount_value" render={({ field }) => (
                <FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" step="0.01" placeholder={form.getValues("discount_type") === 'percentage' ? "10" : "50.00"} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="expires_at" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>Data de Expiração (Opcional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : (<span>Sem data de expiração</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="max_redemptions" render={({ field }) => (
          <FormItem><FormLabel>Máximo de Usos (Opcional)</FormLabel><FormControl><Input type="number" placeholder="Ex: 100" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="is_active" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Ativo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">{form.formState.isSubmitting ? "Salvando..." : "Salvar Cupom"}</Button>
      </form>
    </Form>
  );
};

export default CouponForm;