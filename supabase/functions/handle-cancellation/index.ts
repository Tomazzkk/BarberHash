// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { format } from "https://deno.land/std@0.208.0/datetime/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { appointmentId } = await req.json()
    if (!appointmentId) {
      throw new Error("O ID do agendamento é obrigatório.")
    }

    // 1. Get appointment details
    const { data: appointment, error: fetchError } = await supabaseAdmin
        .from('agendamentos')
        .select('id, barbeiro_id, start_time, clientes(user_id)')
        .eq('id', appointmentId)
        .single();

    if (fetchError) throw fetchError;
    if (!appointment) throw new Error("Agendamento não encontrado.");

    const { barbeiro_id, start_time } = appointment;
    const appointmentDate = format(new Date(start_time), "yyyy-MM-dd");

    // 2. Cancel the appointment
    const { error: cancelError } = await supabaseAdmin
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', appointmentId);

    if (cancelError) throw cancelError;

    // 3. Find users on the waitlist
    const { data: waitlistEntries, error: waitlistError } = await supabaseAdmin
        .from('lista_espera')
        .select('id, client_user_id, barbeiros ( name )')
        .eq('barbeiro_id', barbeiro_id)
        .eq('data', appointmentDate)
        .is('notificado_em', null);

    if (waitlistError) throw waitlistError;
    if (!waitlistEntries || waitlistEntries.length === 0) {
        return new Response(JSON.stringify({ message: 'Agendamento cancelado. Ninguém na lista de espera.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // 4. Get phone numbers for waitlisted clients
    const clientUserIds = waitlistEntries.map(e => e.client_user_id);
    
    const { data: usersResponse, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userMap = new Map(usersResponse.users.map(u => [u.id, u.email]));
    const clientEmails = clientUserIds.map(id => userMap.get(id)).filter(Boolean);

    const { data: clientsWithPhones, error: clientsError } = await supabaseAdmin
        .from('clientes')
        .select('phone')
        .in('email', clientEmails)
        .not('phone', 'is', null);
    if (clientsError) throw clientsError;

    const phoneNumbers = clientsWithPhones.map(c => c.phone);
    const notificationMessage = `Boas notícias! Um horário vagou para o dia ${format(new Date(start_time), "dd/MM/yyyy")} com ${waitlistEntries[0].barbeiros.name}. Corra para agendar no app!`;
    
    // 5. Send notifications
    for (const phone of phoneNumbers) {
        await supabaseAdmin.functions.invoke('send-whatsapp', { body: { to: phone, message: notificationMessage } });
    }

    // 6. Update notified status
    const notifiedIds = waitlistEntries.map(e => e.id);
    if (notifiedIds.length > 0) {
        await supabaseAdmin
            .from('lista_espera')
            .update({ notificado_em: new Date().toISOString() })
            .in('id', notifiedIds);
    }

    return new Response(JSON.stringify({ message: `Agendamento cancelado. ${phoneNumbers.length} cliente(s) notificados.` }), {
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