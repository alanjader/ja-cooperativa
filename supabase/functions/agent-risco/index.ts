// Edge Function: Agente de Risco
// Spec: docs/cooperativa/05-ia-ativa-agentes.md
// Avalia indicadores do cooperado e gera alertas + atualiza semáforos.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleOptions, withCors } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const { cooperado_id } = await req.json();
    if (!cooperado_id) return withCors(new Response(JSON.stringify({ error: 'cooperado_id required' }), { status: 400 }));

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1) carrega dados base do cooperado
    const { data: coop, error } = await sb.from('cooperados').select('*').eq('id', cooperado_id).single();
    if (error || !coop) return withCors(new Response(JSON.stringify({ error: 'not found' }), { status: 404 }));

    // 2) calcula indicadores (placeholder — implementar regra real)
    const indicadores = {
      certificacoes_vencidas: 0,
      laudos_reprovados_90d: 0,
      visitas_atr_atrasadas: 0,
      entregas_vs_safra:     1.0
    };

    // 3) classifica em semáforo
    let cor: 'verde'|'amarelo'|'vermelho' = 'verde';
    if (indicadores.certificacoes_vencidas > 0 || indicadores.laudos_reprovados_90d > 2) cor = 'vermelho';
    else if (indicadores.visitas_atr_atrasadas > 0) cor = 'amarelo';

    // 4) registra no log de agentes
    await sb.from('ai_agentes_log').insert({
      cooperativa_id: coop.cooperativa_id,
      agente: 'agent-risco',
      input: { cooperado_id },
      output: { cor, indicadores }
    });

    return withCors(new Response(JSON.stringify({ cooperado_id, cor, indicadores }), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch (e) {
    return withCors(new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 }));
  }
});
