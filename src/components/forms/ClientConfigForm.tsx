import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Plan } from "@/pages/admin/AdminManagePlans";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ImageUploader from "../ImageUploader";

const formSchema = z.object({
  // Subscription
  plano_id: z.string().uuid().nullable(),
  subscription_status: z.string().nullable(),
  subscription_ends_at: z.date().nullable(),
  custom_features: z.string().optional(),
  // Appearance
  theme: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  login_background_url: z.string().url().optional().or(z.literal('')),
  dashboard_hero_url: z.string().url().optional().or(z.literal('')),
  // Features
  loyalty_enabled: z.boolean().default(false),
  loyalty_target_count: z.coerce.number().int().min(1).optional(),
  loyalty_reward_service_id: z.string().uuid().nullable(),
  sinal_enabled: z.boolean().default(false),
  ga4_measurement_id: z.string().optional(),
});

type ClientConfigFormProps = {
  onSuccess: () => void;
  client: { id: string; config_cliente: any | null };
  plans: Plan[];
};

const statusOptions = [ { value: 'trialing', label: 'Em Teste (Trial)' }, { value: 'active', label: 'Ativo' }, { value: 'past_due', label: 'Pagamento Atrasado' }, { value: 'unpaid', label: 'Não Pago' }, { value: 'canceled', label: 'Cancelado' }];
const themeOptions = [ { value: 'dark', label: 'Padrão (Escuro)' }, { value: 'light', label: 'Claro' }, { value: 'vintage', label: 'Vintage' }, { value: 'midnight', label: 'Meia-noite' }, { value: 'oceanic', label: 'Oceânico' }, { value: 'crimson', label: 'Carmesim' }, { value: 'forest', label: 'Floresta' }, { value: 'luxury', label: 'Luxo' }, { value: 'sunset', label: 'Pôr do Sol' }, { value: 'monochrome', label: 'Monocromático' }];

const ClientConfigForm = ({ onSuccess, client, plans }: ClientConfigFormProps) => {
  const clientConfig = client.config_cliente;
  const [services, setServices] = useState<{id: string, name: string}[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchServices = async () => {
        const { data } = await supabase.from('servicos').select('id, name').eq('user_id', client.id);
        setServices(data || []);
    }
    fetchServices();
  }, [client.id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plano_id: clientConfig?.plano_id || null,
      subscription_status: clientConfig?.subscription_status || null,
      subscription_ends_at: clientConfig?.subscription_ends_at ? new Date(clientConfig.subscription_ends_at) : null,
      custom_features: clientConfig?.custom_features?.join(', ') || "",
      theme: clientConfig?.theme || 'dark',
      logo_url: clientConfig?.logo_url || "",
      login_background_url: clientConfig?.login_background_url || "",
      dashboard_hero_url: clientConfig?.dashboard_hero_url || "",
      loyalty_enabled: clientConfig?.loyalty_enabled || false,
      loyalty_target_count: clientConfig?.loyalty_target_count || 10,
      loyalty_reward_service_id: clientConfig?.loyalty_reward_service_id || null,
      sinal_enabled: clientConfig?.sinal_enabled || false,
      ga4_measurement_id: clientConfig?.ga4_measurement_id || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
        const featuresArray = values.custom_features ? values.custom_features.split(',').map(f => f.trim()).filter(Boolean) : null;
        const { error } = await supabase
          .from("config_cliente")
          .update({
            plano_id: values.plano_id,
            subscription_status: values.subscription_status,
            subscription_ends_at: values.subscription_ends_at ? values.subscription_ends_at.toISOString() : null,
            custom_features: featuresArray,
            theme: values.theme,
            logo_url: values.logo_url,
            login_background_url: values.login_background_url,
            dashboard_hero_url: values.dashboard_hero_url,
            loyalty_enabled: values.loyalty_enabled,
            loyalty_target_count: values.loyalty_target_count,
            loyalty_reward_service_id: values.loyalty_reward_service_id,
            sinal_enabled: values.sinal_enabled,
            ga4_measurement_id: values.ga4_measurement_id,
          })
          .eq("user_id", client.id);
        if (error) throw error;
    },
    onSuccess: () => {
        showSuccess("Configurações atualizadas com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['barbershop_clients'] });
        onSuccess();
    },
    onError: (error) => {
        showError(`Erro ao atualizar: ${error.message}`);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <Tabs defaultValue="subscription">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="subscription">Assinatura</TabsTrigger><TabsTrigger value="appearance">Aparência</TabsTrigger><TabsTrigger value="features">Funcionalidades</TabsTrigger></TabsList>
            <div className="max-h-[60vh] overflow-y-auto p-4">
                <TabsContent value="subscription" className="space-y-4">
                    <FormField control={form.control} name="plano_id" render={({ field }) => (<FormItem><FormLabel>Plano Base</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger></FormControl><SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="custom_features" render={({ field }) => (<FormItem><FormLabel>Recursos Customizados</FormLabel><FormControl><Textarea placeholder="pdv, estoque, marketing" {...field} /></FormControl><FormDescription>Substitui os recursos do plano base. Deixe em branco para usar os do plano.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="subscription_status" render={({ field }) => (<FormItem><FormLabel>Status da Assinatura</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um status" /></SelectTrigger></FormControl><SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="subscription_ends_at" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Vencimento da Assinatura</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Sem data de vencimento</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </TabsContent>
                <TabsContent value="appearance" className="space-y-4">
                    <FormField control={form.control} name="theme" render={({ field }) => (<FormItem><FormLabel>Tema Visual</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{themeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="logo_url" render={({ field }) => (<FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormDescription>Use uma URL de imagem pública.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="login_background_url" render={({ field }) => (<FormItem><FormLabel>Imagem de Fundo (Login)</FormLabel><ImageUploader bucketName="client-assets" filePath={`${client.id}/login`} currentUrl={field.value} onUpload={(url) => field.onChange(url)} onRemove={() => field.onChange("")} /><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="dashboard_hero_url" render={({ field }) => (<FormItem><FormLabel>Imagem de Fundo (Dashboard Cliente)</FormLabel><ImageUploader bucketName="client-assets" filePath={`${client.id}/dashboard`} currentUrl={field.value} onUpload={(url) => field.onChange(url)} onRemove={() => field.onChange("")} /><FormMessage /></FormItem>)} />
                </TabsContent>
                <TabsContent value="features" className="space-y-4">
                    <FormField control={form.control} name="loyalty_enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Programa de Fidelidade</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    {form.watch('loyalty_enabled') && (<div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="loyalty_target_count" render={({ field }) => (<FormItem><FormLabel>Nº de Cortes</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="loyalty_reward_service_id" render={({ field }) => (<FormItem><FormLabel>Serviço de Recompensa</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></FormItem>)} /></div>)}
                    <FormField control={form.control} name="sinal_enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><div className="space-y-0.5"><FormLabel>Sinal de Agendamento</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="ga4_measurement_id" render={({ field }) => (<FormItem><FormLabel>ID do Google Analytics 4</FormLabel><FormControl><Input placeholder="G-XXXXXXXXXX" {...field} /></FormControl></FormItem>)} />
                </TabsContent>
            </div>
        </Tabs>
        <Button type="submit" disabled={mutation.isPending} className="w-full mt-6">
          {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </Form>
  );
};

export default ClientConfigForm;