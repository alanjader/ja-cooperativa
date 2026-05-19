/* JA Cooperativa - API / Supabase client wrapper
 * Opção C': mesmo Supabase do Produtor, schema 'cooperativa' isolado.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.JA_COOP_CONFIG;

export const sb = createClient(cfg.supabase.url, cfg.supabase.anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } },
  db: { schema: cfg.supabase.schema }   // todas as queries usam schema 'cooperativa' por padrão
});

/** Wrapper amigável */
export const api = {
  async select(table, opts = {}) {
    let q = sb.from(table).select(opts.columns || '*', { count: opts.count ? 'exact' : undefined });
    if (opts.filter) Object.entries(opts.filter).forEach(([k, v]) => {
      if (Array.isArray(v))      q = q.in(k, v);
      else if (v === null)       q = q.is(k, null);
      else if (typeof v === 'object' && v.op) q = q[v.op](k, v.val);
      else                       q = q.eq(k, v);
    });
    if (opts.search) q = q.or(opts.search.fields.map(f => `${f}.ilike.%${opts.search.term}%`).join(','));
    if (opts.order)  q = q.order(opts.order, { ascending: opts.asc !== false });
    if (opts.range)  q = q.range(opts.range[0], opts.range[1]);
    if (opts.limit)  q = q.limit(opts.limit);
    const { data, error, count } = await q;
    if (error) throw error;
    return opts.count ? { data, count } : data;
  },
  async one(table, id, columns = '*') {
    const { data, error } = await sb.from(table).select(columns).eq('id', id).maybeSingle();
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
  async remove(table, id) {
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) throw error;
  },
  async rpc(fn, params) {
    const { data, error } = await sb.rpc(fn, params);
    if (error) throw error;
    return data;
  },
  async fn(name, body) {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (error) throw error;
    return data;
  },
  /** Chama uma bridge function no schema 'bridge' (cross-schema controlado) */
  async bridge(fn, params) {
    const { data, error } = await sb.schema('bridge').rpc(fn, params);
    if (error) throw error;
    return data;
  },
  channel(name) { return sb.channel(name); },
  /** Tenta detectar a cooperativa do usuário; fallback para dev */
  async cooperativaId() {
    const { data } = await sb.auth.getUser();
    return data?.user?.user_metadata?.cooperativa_id
        || data?.user?.app_metadata?.cooperativa_id
        || cfg.devCooperativaId;
  }
};

export default api;
