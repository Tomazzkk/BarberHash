// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient()
})

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
      throw new Error("ID do agendamento é obrigatório.")
    }

    // Fetch appointment details
    const { data: appointment, error } = await supabaseAdmin
      .from('agendamentos')
      .select('servicos(name, sinal_value), clientes(email)')
      .eq('id', appointmentId)
      .single()

    if (error) throw error
    if (!appointment || !appointment.servicos || !appointment.servicos.sinal_value) {
      throw new Error("Detalhes do agendamento ou valor do sinal não encontrados.")
    }

    const { servicos, clientes } = appointment;
    const customerEmail = clientes?.email || undefined;
    const priceInCents = Math.round(servicos.sinal_value * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Sinal para: ${servicos.name}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/app/historico?payment=success`,
      cancel_url: `${req.headers.get('origin')}/app/historico?payment=cancelled`,
      metadata: {
        appointment_id: appointmentId,
      },
    })

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})