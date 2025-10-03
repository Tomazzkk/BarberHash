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
    const { data: { user: clientUser } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!clientUser) throw new Error("Usuário não autenticado.")

    const { notificationId } = await req.json()
    if (!notificationId) throw new Error("ID da notificação é obrigatório.")

    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('details')
      .eq('id', notificationId)
      .eq('user_id', clientUser.id)
      .single()

    if (notifError || !notification) throw new Error("Notificação inválida ou não encontrada.")

    const { inviter_id } = notification.details

    const { data: clientProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', clientUser.id)
      .single()
    if (profileError) throw profileError

    const { data: ownerSede, error: sedeError } = await supabaseAdmin
      .from('sedes')
      .select('id')
      .eq('user_id', inviter_id)
      .order('is_matriz', { ascending: false })
      .limit(1)
      .single()
    if (sedeError || !ownerSede) throw new Error("Sede principal do dono não encontrada.")

    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'barbeiro', owner_id: inviter_id })
      .eq('id', clientUser.id)
    if (updateProfileError) throw updateProfileError

    const { error: insertBarberError } = await supabaseAdmin
      .from('barbeiros')
      .insert({
        profile_id: clientUser.id,
        user_id: inviter_id,
        name: clientProfile.full_name,
        sede_id: ownerSede.id,
      })
    if (insertBarberError) throw insertBarberError

    await supabaseAdmin.from('notifications').delete().eq('id', notificationId)

    return new Response(JSON.stringify({ message: 'Promoção para barbeiro aceita com sucesso!' }), {
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