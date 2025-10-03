// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Placeholder for OpenAI API call
async function getAiSuggestion(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set. Returning placeholder suggestion.");
    return "✨ Super oferta de outono! Agende um corte + barba e ganhe 20% de desconto. Válido até o final do mês. Não perca!";
  }

  // This is where the actual API call to OpenAI would go.
  // For now, we'll simulate a response.
  // Example using OpenAI API:
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch from OpenAI');
  }
  const data = await response.json();
  return data.choices[0].message.content.trim();
  */

  // Returning a placeholder as the API key is not available.
  return `Sugestão para o público selecionado: ${prompt.substring(0, 100)}...`;
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

    const { audience, sedeId } = await req.json()
    if (!audience) {
      throw new Error("Parâmetro 'audience' é obrigatório.")
    }

    let promptContext = "";
    if (audience === 'inactive') {
        promptContext = "O público são clientes que não agendam há mais de 90 dias. O objetivo é reativá-los com uma oferta de 'sentimos sua falta'.";
    } else if (audience === 'active') {
        promptContext = "O público são clientes fiéis. O objetivo é recompensá-los ou anunciar uma novidade.";
    } else {
        promptContext = "O público são todos os clientes. O objetivo é uma campanha geral, como um anúncio de feriado ou uma promoção para todos.";
    }

    const prompt = `
      Você é um especialista em marketing para barbearias. Crie uma mensagem curta e persuasiva para uma campanha de WhatsApp.
      A mensagem deve ter no máximo 160 caracteres.
      Use emojis para torná-la mais atrativa.
      Não inclua saudações como "Olá [Nome]".
      
      Contexto da campanha: ${promptContext}
    `;

    const suggestion = await getAiSuggestion(prompt);

    return new Response(JSON.stringify({ suggestion }), {
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