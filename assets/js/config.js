/* JA Cooperativa - Config global
 * Opção C': mesmo Supabase do Produtor, schema 'cooperativa' isolado.
 */
window.JA_COOP_CONFIG = {
  app: {
    name: 'JA Cooperativa',
    version: '0.2.0',
    env: location.hostname === 'localhost' ? 'dev' : 'prod'
  },
  supabase: {
    // MESMO projeto Supabase do Produtor
    url: 'https://gohoqgctcqltorfeohom.supabase.co',
    // TODO: trocar pela anon key real (segura para client)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PLACEHOLDER_ANON_KEY',
    // Schema dedicado deste módulo
    schema: 'cooperativa'
  },
  produtor: {
    // Mesmo Supabase, schema 'public'
    url: 'https://alanjader.github.io/ja-agro',
    schema: 'public'
  },
  features: {
    aiAgents: true,
    realtime: true,
    offline: true,
    blockchain: false
  },
  /** Cooperativa demo para dev (substituir por JWT claim em prod) */
  devCooperativaId: '00000000-0000-0000-0000-000000000001'
};
