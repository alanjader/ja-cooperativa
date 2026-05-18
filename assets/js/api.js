/* JA Cooperativa - API / Supabase client wrapper
 * Carrega @supabase/supabase-js via ESM CDN.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.JA_COOP_CONFIG;

export const sb = createClient(cfg.supabase.url, cfg.supabase.anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } }
});

/** Wrapper amigável para chamadas, com tratamento de erro padronizado */
export const api = {
  async select(table, opts = {}) {
    const q = sb.from(table).select(opts.columns || '*');
    if (opts.filter) Object.entries(opts.filter).forEach(([k,v]) => q.eq(k,v));
    if (opts.order)  q.order(opts.order, { ascending: opts.asc !== false });
    if (opts.limit)  q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async insert(table, row) {
    const { data, error } = await sb.from(table).insert(row).select().single();
    if (error) throw error;
    return data;
  },
  async update(table, id, patch) {
    const { data, error } = await sb.from(table).update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async rpc(fn, params) {
    const { data, error } = await sb.rpc(fn, params);
    if (error) throw error;
    return data;
  },
  /** Chama uma Edge Function (agente IA, integração sensível etc) */
  async fn(name, body) {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (error) throw error;
    return data;
  },
  /** Realtime subscribe para uma tabela */
  channel(name) { return sb.channel(name); }
};

export default api;
