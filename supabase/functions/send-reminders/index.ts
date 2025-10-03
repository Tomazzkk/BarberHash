// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { format } from "https://deno.land/std@0.208.0/datetime/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Esta função é projetada para ser acionada por um cron job (agendador).
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Encontra agendamentos que precisam de um lembrete
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Usamos uma janela de uma hora para garantir que pegamos todos os agendamentos
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000); 

    const { data: appointments, error: fetchError } = await supabaseAdmin
      .from('agendamentos')
      .select(`
        id,
        start_time,
        clientes ( phone, name ),
        servicos ( name ),
        barbeiros ( name )
      `)
      .eq('status', 'confirmado')
      .is('reminder_sent_at', null)
      .gte('start_time', twentyFourHoursFromNow.toISOString())
      .lt('start_time', twentyFiveHoursFromNow.toISOString());

    if (fetchError) {
      throw new Error(`Erro ao buscar agendamentos: ${fetchError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum lembrete para enviar no momento.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Processa e envia os lembretes
    const sentAppointmentIds = [];

    for (const apt of appointments) {
      if (apt.clientes && apt.clientes.phone) {
        const appointmentTime = format(new Date(apt.start_time), "dd/MM 'às' HH:mm");
        const message = `Olá, ${apt.clientes.name}! 👋 Só para lembrar do seu agendamento de ${apt.servicos.name} com ${apt.barbeiros.name} amanhã, dia ${appointmentTime}. Mal podemos esperar para te ver!`;
        
        // Invoca a função send-whatsapp (não precisa esperar a resposta)
        supabaseAdmin.functions.invoke('send-whatsapp', { body: { to: apt.clientes.phone, message } });
        
        sentAppointmentIds.push(apt.id);
      }
    }

    // 3. Atualiza os agendamentos para marcar os lembretes como enviados
    if (sentAppointmentIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('agendamentos')
        .update({ reminder_sent_at: new Date().toISOString() })
        .in('id', sentAppointmentIds);

      if (updateError) {
        // Registra o erro mas não falha a execução inteira
        console.error(`Erro ao atualizar status do lembrete: ${updateError.message}`);
      }
    }

    return new Response(JSON.stringify({ message: `Processado e enviado com sucesso ${sentAppointmentIds.length} lembretes.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});