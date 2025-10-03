// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { subDays, setHours, addMinutes } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) throw new Error("User not found.")

    const { enable } = await req.json()

    if (enable) {
      // --- CLEANUP PREVIOUS SAMPLE DATA ---
      const tablesToDelete = ['agendamentos', 'clientes', 'servicos', 'barbeiros', 'produtos', 'sedes', 'financeiro'];
      for (const table of tablesToDelete) {
        await supabaseAdmin.from(table).delete().eq('user_id', user.id).eq('is_sample_data', true);
      }

      // --- GENERATE NEW SAMPLE DATA ---
      let { data: sedes } = await supabaseAdmin.from('sedes').select('id').eq('user_id', user.id).limit(1);
      let sedeId;

      if (!sedes || sedes.length === 0) {
        const { data: newSede, error: sedeError } = await supabaseAdmin.from('sedes').insert({ user_id: user.id, name: 'Sede Principal (Exemplo)', is_sample_data: true }).select('id').single();
        if (sedeError) throw new Error("Falha ao criar sede padrão.");
        sedeId = newSede.id;
      } else {
        sedeId = sedes[0].id;
      }

      const { data: sampleBarbers } = await supabaseAdmin.from('barbeiros').insert([
        { user_id: user.id, sede_id: sedeId, name: '[Exemplo] João Barbeiro', commission_percentage: 50, is_sample_data: true },
        { user_id: user.id, sede_id: sedeId, name: '[Exemplo] Carlos Cabeleireiro', commission_percentage: 40, is_sample_data: true },
      ]).select('id');
      if (!sampleBarbers) throw new Error("Failed to create sample barbers");

      const { data: sampleServices } = await supabaseAdmin.from('servicos').insert([
        { user_id: user.id, sede_id: sedeId, name: '[Exemplo] Corte Masculino', price: 40, duration_minutes: 30, is_sample_data: true },
        { user_id: user.id, sede_id: sedeId, name: '[Exemplo] Barba', price: 30, duration_minutes: 30, is_sample_data: true },
        { user_id: user.id, sede_id: sedeId, name: '[Exemplo] Corte + Barba', price: 65, duration_minutes: 60, is_sample_data: true },
      ]).select('id, duration_minutes, name, price');
      if (!sampleServices) throw new Error("Failed to create sample services");

      const clientNames = ["Miguel", "Arthur", "Gael", "Heitor", "Theo", "Davi", "Gabriel", "Bernardo", "Samuel", "Helena", "Alice", "Laura", "Maria Alice", "Sophia"];
      const { data: sampleClients } = await supabaseAdmin.from('clientes').insert(
        clientNames.map(name => ({ user_id: user.id, sede_id: sedeId, name: `[Exemplo] ${name}`, is_sample_data: true }))
      ).select('id, name');
      if (!sampleClients) throw new Error("Failed to create sample clients");

      await supabaseAdmin.from('produtos').insert([
        { user_id: user.id, sede_id: sedeId, name: '[Exemplo] Pomada Modeladora', price: 35.50, quantity: 10, min_quantity: 2, is_sample_data: true },
        { user_id: user.id, sede_id: sedeId, name: '[Exemplo] Óleo para Barba', price: 25.00, quantity: 15, min_quantity: 5, is_sample_data: true },
      ]);

      const appointmentsToInsert = [];
      const financialEntriesToInsert = [];
      const today = new Date();
      const ninetyDaysAgo = subDays(today, 90);
      const APPOINTMENT_COUNT = 50;

      for (let i = 0; i < APPOINTMENT_COUNT; i++) {
        const service = getRandomElement(sampleServices);
        const client = getRandomElement(sampleClients);
        const barber = getRandomElement(sampleBarbers);
        
        const randomTimestamp = ninetyDaysAgo.getTime() + Math.random() * (today.getTime() - ninetyDaysAgo.getTime());
        const randomDay = new Date(randomTimestamp);

        const startHour = Math.floor(Math.random() * 9) + 9; // 9am to 5pm
        const startMinute = Math.random() > 0.5 ? 30 : 0;
        const startTime = setHours(randomDay, startHour);
        startTime.setMinutes(startMinute);
        const endTime = addMinutes(startTime, service.duration_minutes);
        const status = startTime < today && Math.random() < 0.9 ? 'concluido' : 'confirmado';

        const appointment = {
          user_id: user.id, sede_id: sedeId, cliente_id: client.id, servico_id: service.id,
          barbeiro_id: barber.id, start_time: startTime.toISOString(), end_time: endTime.toISOString(),
          status, is_sample_data: true,
        };
        appointmentsToInsert.push(appointment);

        if (status === 'concluido') {
          financialEntriesToInsert.push({
            user_id: user.id, sede_id: sedeId, agendamento_id: null, tipo: 'entrada',
            valor: service.price, descricao: `Serviço: ${service.name} - Cliente: ${client.name}`,
            data: startTime.toISOString(), is_sample_data: true,
          });
        }
      }
      
      // Add some sample expenses
      financialEntriesToInsert.push({ user_id: user.id, sede_id: sedeId, tipo: 'saida', valor: 150.75, descricao: '[Exemplo] Compra de lâminas', data: subDays(today, 10).toISOString(), is_sample_data: true });
      financialEntriesToInsert.push({ user_id: user.id, sede_id: sedeId, tipo: 'saida', valor: 80.00, descricao: '[Exemplo] Café e lanches', data: subDays(today, 25).toISOString(), is_sample_data: true });


      if (appointmentsToInsert.length > 0) await supabaseAdmin.from('agendamentos').insert(appointmentsToInsert);
      if (financialEntriesToInsert.length > 0) await supabaseAdmin.from('financeiro').insert(financialEntriesToInsert);

      await supabaseAdmin.from('config_cliente').upsert({ user_id: user.id, training_mode_active: true }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ message: 'Modo de treinamento ativado e dados de exemplo criados.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else {
      const tables = ['agendamentos', 'clientes', 'servicos', 'barbeiros', 'produtos', 'sedes', 'financeiro'];
      for (const table of tables) {
        await supabaseAdmin.from(table).delete().eq('user_id', user.id).eq('is_sample_data', true);
      }
      await supabaseAdmin.from('config_cliente').upsert({ user_id: user.id, training_mode_active: false }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ message: 'Modo de treinamento desativado e dados de exemplo removidos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})