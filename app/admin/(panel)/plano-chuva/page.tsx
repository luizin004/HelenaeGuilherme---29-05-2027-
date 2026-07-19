import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { ContingenciaForm, type ContingenciaData } from "@/components/admin/ContingenciaForm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const DEFAULT: ContingenciaData = {
  previsao: null, areas_cobertas: null, cobertura_adicional: null, gerador: false, drenagem: null,
  acesso_veiculos: null, protecao_equipamentos: null, mudanca_palco: null, responsavel: null,
  horario_limite: null, fornecedores: null, comunicado: null, status: "planejando",
};

export default async function PlanoChuvaPage() {
  const supabase = createClient();
  let data: ContingenciaData = DEFAULT;
  if (supabase) {
    const { data: row } = await supabase.from("hg_contingencia").select("*").eq("id", 1).maybeSingle();
    if (row) data = row as ContingenciaData;
  }

  return (
    <>
      <PageTitle>Plano de chuva</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para editar o plano.</Notice>
      ) : (
        <Notice>
          Plano operacional interno (não aparece no site). No site, a mensagem pública é apenas
          &quot;estaremos preparados para o que der e vier&quot;. Aqui fica o plano real.
        </Notice>
      )}

      <Panel title="Plano operacional de contingência">
        <div className="p-6"><ContingenciaForm data={data} /></div>
      </Panel>
    </>
  );
}
