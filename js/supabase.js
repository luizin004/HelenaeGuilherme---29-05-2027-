/* ============================================================
   Configuração do Supabase (cliente)
   ------------------------------------------------------------
   Preencha com as credenciais do projeto (Project URL e a
   chave publishable/anon). Enquanto não configurado, as telas
   funcionam com dados de exemplo.

   Uso (quando ativar o backend):
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="js/supabase.js"></script>
     const { data } = await sb.from('guests').select('*');
   ============================================================ */

const SUPABASE_URL = ''; // ex.: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = '';

const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const sb = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabaseReady) {
  console.info('[Supabase] Ainda não configurado — usando dados de exemplo.');
}
