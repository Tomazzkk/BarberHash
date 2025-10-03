// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const sendMessage = async (to, message, instanceId, apiToken) => {
    if (!to) return { success: false, error: 'Número de telefone inválido.' };
    const cleanedPhone = to.replace(/\D/g, '');
    if (cleanedPhone.length < 10) return { success: false, error: `Número inválido: ${to}` };
    try {
        const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${apiToken}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanedPhone, message: message }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Falha ao enviar para ${cleanedPhone}:`, errorData);
            return { success: false, error: `API Error for ${cleanedPhone}` };
        }
        return { success: true };
    } catch (e) {
        console.error(`Erro de fetch para ${cleanedPhone}:`, e);
        return { success: false, error: `Fetch Error for ${cleanedPhone}` };
    }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { audience, message, sedeId } = await req.json()
    if (!audience || !message) {
      throw new Error("Parâmetros 'audience' e 'message' são obrigatórios.")
    }

    const instanceId = Deno.env.get('ZAPI_INSTANCE')
    const apiToken = Deno.env.get('ZAPI_TOKEN')
    if (!instanceId || !apiToken) {
        throw new Error("Credenciais da API de WhatsApp não configuradas.");
    }

    let allClientsQuery = supabaseAdmin.from('clientes').select('id, phone, email').not('phone', 'is', null);
    if (sedeId) {
        allClientsQuery = allClientsQuery.eq('sede_id', sedeId);
    }
    const { data: allClients, error: allClientsError } = await allClientsQuery;
    if (allClientsError) throw allClientsError;

    let clientsToContact = [];
    if (audience === 'all') {
        clientsToContact = allClients;
    } else {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        let activeClientsQuery = supabaseAdmin.from('agendamentos').select('cliente_id').gte('start_time', cutoffDate.toISOString());
        if (sedeId) activeClientsQuery = activeClientsQuery.eq('sede_id', sedeId);
        const { data: activeClientsData, error: activeError } = await activeClientsQuery;
        if (activeError) throw activeError;
        const activeClientIds = new Set(activeClientsData.map(r => r.cliente_id));
        if (audience === 'active') {
            clientsToContact = allClients.filter(c => activeClientIds.has(c.id));
        } else if (audience === 'inactive') {
            clientsToContact = allClients.filter(c => !activeClientIds.has(c.id));
        }
    }

    if (clientsToContact.length === 0) {
        return new Response(JSON.stringify({ message: 'Nenhum cliente encontrado para este público.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const clientEmails = clientsToContact.map(c => c.email).filter(Boolean);
    let appUsersToNotify = [];
    if (clientEmails.length > 0) {
        const { data: users, error: usersError } = await supabaseAdmin.rpc('get_user_ids_by_emails', {
            p_emails: clientEmails
        });
        if (usersError) throw usersError;
        appUsersToNotify = users || [];
    }

    if (appUsersToNotify.length > 0) {
        const notificationsToInsert = appUsersToNotify.map(user => ({
            user_id: user.id,
            type: 'promotion',
            title: 'Uma nova mensagem para você!',
            message: message,
        }));
        const { error: insertError } = await supabaseAdmin.from('notifications').insert(notificationsToInsert);
        if (insertError) console.error("Falha ao criar notificações da campanha:", insertError.message);
    }

    const phoneNumbers = clientsToContact.map(c => c.phone);
    const sendPromises = phoneNumbers.map(phone => sendMessage(phone, message, instanceId, apiToken));
    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return new Response(JSON.stringify({ 
        message: `Campanha enviada. WhatsApp: ${successCount} sucessos, ${failureCount} falhas. Notificações no app: ${appUsersToNotify.length}.` 
    }), {
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