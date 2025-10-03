// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to, message } = await req.json()

    if (!to || !message) {
      throw new Error("'to' (número de telefone) e 'message' (mensagem) são obrigatórios.")
    }

    // Pega as credenciais do ambiente de segredos do Supabase
    const instanceId = Deno.env.get('ZAPI_INSTANCE')
    const apiToken = Deno.env.get('ZAPI_TOKEN')

    if (!instanceId || !apiToken) {
        console.warn("As credenciais da API de WhatsApp (ZAPI_INSTANCE, ZAPI_TOKEN) não estão configuradas nos segredos da Edge Function. Usando modo de simulação.");
        
        // Bloco de simulação (mantido como fallback)
        console.log(`--- SIMULANDO NOTIFICAÇÃO WHATSAPP ---`);
        console.log(`Destinatário: ${to}`);
        console.log(`Mensagem: ${message}`);
        console.log(`---------------------------------------`);

        return new Response(JSON.stringify({ success: true, message: `Notificação para ${to} simulada com sucesso.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // Chamada real para a API do Z-API
    const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${apiToken}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: to, message: message }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do WhatsApp: ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json();

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})