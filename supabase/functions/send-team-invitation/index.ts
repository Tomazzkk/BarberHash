// @ts-nocheck
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user: inviter } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!inviter) throw new Error("Usuário não autenticado.")

    const { clientId } = await req.json()
    if (!clientId) throw new Error("ID do cliente é obrigatório.")

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clientes')
      .select('user_id, email')
      .eq('id', clientId)
      .eq('user_id', inviter.id)
      .single()

    if (clientError || !client) throw new Error("Cliente não encontrado ou você não tem permissão.")
    if (!client.email) throw new Error("Este cliente não possui um email cadastrado para receber o convite.")

    const { data: usersResponse, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email: client.email });
    if (userError) throw userError;
    if (!usersResponse || usersResponse.users.length === 0) throw new Error("Não foi possível encontrar o perfil de usuário deste cliente.");
    const targetUser = usersResponse.users[0];

    const notification = {
      user_id: targetUser.id,
      type: 'team_invitation',
      title: 'Você foi convidado para a equipe!',
      message: `Você foi convidado para se juntar à equipe. Aceite para ter acesso às ferramentas de profissional.`,
      details: { inviter_id: inviter.id, client_id: clientId }
    }

    const { error: insertError } = await supabaseAdmin.from('notifications').insert(notification)
    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: 'Convite enviado com sucesso!' }), {
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