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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { appointmentId } = await req.json()

    if (!appointmentId) {
      throw new Error("O ID do agendamento é obrigatório.")
    }

    // 1. Fetch appointment details, including client ID for loyalty
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('agendamentos')
      .select(`
        *,
        servicos ( name, price ),
        clientes ( id, name, email )
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError) throw appointmentError
    if (!appointment) throw new Error("Agendamento não encontrado.")
    
    if (appointment.status === 'concluido') {
        return new Response(JSON.stringify({ message: 'O agendamento já foi concluído.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    // 2. Update appointment status to 'concluido'
    const { error: updateError } = await supabaseAdmin
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', appointmentId)

    if (updateError) throw updateError

    // 3. Create the corresponding financial entry
    if (!appointment.servicos || !appointment.clientes) {
        throw new Error("Serviço ou cliente associado não encontrado.")
    }

    const financialEntry = {
      user_id: appointment.user_id,
      agendamento_id: appointment.id,
      tipo: 'entrada',
      valor: appointment.servicos.price,
      descricao: `Serviço: ${appointment.servicos.name} - Cliente: ${appointment.clientes.name}`,
      sede_id: appointment.sede_id,
    }

    const { error: insertError } = await supabaseAdmin
      .from('financeiro')
      .insert(financialEntry)

    if (insertError) throw insertError

    // 4. Increment loyalty count for the client
    if (appointment.user_id && appointment.clientes?.id) {
        const { error: loyaltyError } = await supabaseAdmin.rpc('increment_loyalty_count', {
            p_user_id: appointment.user_id,
            p_cliente_id: appointment.clientes.id
        });

        if (loyaltyError) {
            // Log the error but don't fail the whole transaction
            console.error(`Loyalty increment failed for appointment ${appointmentId}:`, loyaltyError.message);
        }
    }

    // 5. Check for referral completion
    if (appointment.clientes?.email) {
        const { data: referral, error: referralError } = await supabaseAdmin
            .from('referrals')
            .select('id, status')
            .eq('referred_email', appointment.clientes.email)
            .eq('owner_user_id', appointment.user_id)
            .eq('status', 'pending')
            .limit(1)
            .single();

        if (referral && !referralError) {
            // Check if this is the first completed appointment for this client
            const { count, error: countError } = await supabaseAdmin
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .eq('cliente_id', appointment.clientes.id)
                .eq('status', 'concluido');
            
            // The count will be 1 because we just completed this one
            if (!countError && count === 1) {
                const { error: updateReferralError } = await supabaseAdmin
                    .from('referrals')
                    .update({ status: 'completed', referred_client_id: appointment.clientes.id })
                    .eq('id', referral.id);
                
                if (updateReferralError) {
                    console.error(`Referral update failed for ${referral.id}:`, updateReferralError.message);
                } else {
                    console.log(`Referral ${referral.id} completed.`);
                }
            }
        }
    }

    return new Response(JSON.stringify({ message: 'Agendamento concluído, lançamento financeiro criado e fidelidade atualizada.' }), {
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