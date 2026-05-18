/* JA Cooperativa - Auth helpers */
import { sb } from './api.js';

export const auth = {
  async user() {
    const { data } = await sb.auth.getUser();
    return data.user;
  },
  async session() {
    const { data } = await sb.auth.getSession();
    return data.session;
  },
  async signInPassword(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signInMagicLink(email) {
    const { data, error } = await sb.auth.signInWithOtp({ email });
    if (error) throw error;
    return data;
  },
  async signInWithProdutor() {
    // SSO via Supabase Auth (mesmo provider que o produtor usa)
    // Implementação real: ver docs/cooperativa/04-federacao-sso.md
    throw new Error('SSO produtor: implementar via JWT bridge.');
  },
  async signOut() {
    await sb.auth.signOut();
    location.href = '/index.html';
  },
  /** Garante que o usuário esteja logado, senão redireciona */
  async requireLogin(redirect = '/index.html') {
    const u = await auth.user();
    if (!u) { location.href = redirect; throw new Error('not-logged-in'); }
    return u;
  },
  /** Pega a cooperativa_id ativa do JWT/profile */
  async cooperativaId() {
    const u = await auth.user();
    return u?.user_metadata?.cooperativa_id || u?.app_metadata?.cooperativa_id;
  },
  onChange(cb) {
    return sb.auth.onAuthStateChange((event, session) => cb(event, session));
  }
};

export default auth;
