/* JA Cooperativa - Config global
 * Substitua os valores reais quando o Supabase project for criado.
 */
window.JA_COOP_CONFIG = {
  app: {
    name: 'JA Cooperativa',
    version: '0.1.0-bootstrap',
    env: location.hostname === 'localhost' ? 'dev' : 'prod'
  },
  supabase: {
    // TODO: trocar pelos valores reais do projeto Supabase de cooperativa
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_ANON_KEY'
  },
  produtor: {
    // Federação com JA Agrotec Produtor
    url: 'https://alanjader.github.io/ja-agro',
    supabaseUrl: 'https://zpgabskeunywcgtojcrg.supabase.co'
  },
  features: {
    aiAgents: true,
    realtime: true,
    offline: true,
    blockchain: false  // anchoring opt-in
  }
};
