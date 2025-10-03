import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  mercadopago_enabled: z.boolean().default(false),
  mercadopago_access_token: z.string().optional(),
});

const MercadoPagoForm = () => {
  const { config, user, fetchSessionData, session } = useSessionStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mercadopago_enabled: config?.mercadopago_enabled || false,
      mercadopago_access_token: config?.mercadopago_access_token || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Não foi possível salvar. Tente novamente.");
      return;
    }
    setIsSaving(true);
    const toastId = showLoading("Salvando configurações do Mercado Pago...");

    const { error } = await supabase
      .from('config_cliente')
      .upsert({ 
        user_id: user.id, 
        mercadopago_enabled: values.mercadopago_enabled,
        mercadopago_access_token: values.mercadopago_access_token 
      }, { onConflict: 'user_id' });

    dismissToast(toastId);
    if (error) {
      showError(`Erro ao salvar: ${error.message}`);
    } else {
      showSuccess("Configurações salvas com sucesso!");
      if (session) {
        fetchSessionData(session);
      }
    }
    setIsSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integração com Mercado Pago</CardTitle>
        <CardDescription>
          Conecte sua conta do Mercado Pago para aceitar pagamentos online. 
          <a href="https://www.mercadopago.com.br/developers/panel/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">
            Obtenha suas credenciais aqui.
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="mercadopago_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Ativar Mercado Pago</FormLabel>
                    <FormDescription>
                      Permitir que clientes paguem online com Mercado Pago.
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
            <FormField
              control={form.control}
              name="mercadopago_access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token de Produção</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showToken ? "text" : "password"}
                        placeholder="APP_USR-..." 
                        {...field} 
                      />
                      <button type="button" onClick={() => setShowToken(!showToken)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground">
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Seu token de acesso de produção (começa com APP_USR-).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoForm;