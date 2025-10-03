import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

    const { promotion_id } = await req.json()
    if (!promotion_id) {
      throw new Error("O ID da promoção é obrigatório.")
    }

    const { data: promotion, error: promoError } = await supabaseAdmin
      .from('promocoes')
      .select('name, description, sede_id')
      .eq('id', promotion_id)
      .single();

    if (promoError) throw promoError;
    if (!promotion) throw new Error("Promoção não encontrada.");

    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clientes')
      .select('email')
      .eq('sede_id', promotion.sede_id)
      .not('email', 'is', null);

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum cliente com email para notificar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const clientEmails = clients.map(c => c.email).filter(Boolean);
    if (clientEmails.length === 0) {
        return new Response(JSON.stringify({ message: 'Nenhum cliente com email válido para notificar.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const { data: users, error: usersError } = await supabaseAdmin.rpc('get_user_ids_by_emails', {
        p_emails: clientEmails
    });

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
        return new Response(JSON.stringify({ message: 'Nenhum cliente app-user para notificar.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const notificationsToInsert = users.map(user => ({
      user_id: user.id,
      type: 'promotion',
      title: `Nova Promoção: ${promotion.name}!`,
      message: promotion.description || 'Temos uma nova oferta especial para você. Confira!',
    }));

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: `${users.length} clientes notificados sobre a promoção.` }), {
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