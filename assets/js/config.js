/* JA Cooperativa - Config loader
 * REGRA: NENHUM valor fixo neste arquivo. Tudo vem de assets/config/parametros.json.
 * Para trocar ambiente/keys: edite SOMENTE o parametros.json (ou substitua em deploy).
 */
(function(){
  const path = "assets/config/parametros.json";
  window.JA_COOP_CONFIG_READY = fetch(path + "?_=" + Date.now(), { cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error("Falha ao carregar " + path + " (status " + r.status + ")");
      return r.json();
    })
    .then(cfg => {
      window.JA_COOP_CONFIG = cfg;
      console.info("[JA Cooperativa] config carregado:", cfg.app?.name, "v" + cfg.app?.version, "env=" + cfg.app?.env);
      return cfg;
    })
    .catch(err => {
      console.error("[JA Cooperativa] ERRO de configuracao:", err);
      const host = document.querySelector("#side-host") || document.body;
      host.innerHTML = '<div class="err" style="margin:32px;padding:24px">Erro carregando parametros: ' + err.message + '</div>';
      throw err;
    });
})();
/* JA Cooperativa - Config global
 * Opcao C\'': mesmo Supabase do Produtor, schema "cooperativa" isolado.
 * Migrado para o novo padrao de keys do Supabase (2025+):
 *   - publishableKey (sb_publishable_...) substitui a antiga anonKey/JWT.
 *   - secret keys (sb_secret_...) NUNCA devem aparecer aqui.
 */
window.JA_COOP_CONFIG = {
  app: {
    name: "JA Cooperativa",
    version: "0.3.0",
    env: location.hostname === "localhost" ? "dev" : "prod"
  },
  supabase: {
    // MESMO projeto do Produtor (Opcao C\''), schema cooperativa isolado.
    url: "https://gohoqgctcqltorfeohom.supabase.co",
    publishableKey: "sb_publishable_7SUqbx9ZQoa44Ohh_o6zmw_E_g8Vzl-",
    schema: "cooperativa"
  },
  produtor: {
    url: "https://gohoqgctcqltorfeohom.supabase.co",
    schema: "public"
  },
  features: {
    aiAgents: true,
    realtime: true,
    offline: false,
    blockchain: false
  },
  devCooperativaId: "00000000-0000-0000-0000-000000000001"
};
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
