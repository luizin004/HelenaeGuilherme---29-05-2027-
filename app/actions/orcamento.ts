"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { CATALOGO } from "@/domain/orcamento/catalogo";

export interface OrcamentoState {
  ok: boolean;
  message: string;
}

// Conjunto de pares válidos "categoria|||nome" do catálogo (evita entrada forjada).
const VALIDOS = new Set(
  CATALOGO.flatMap((g) => g.itens.map((i) => `${g.categoria}|||${i.nome}`)),
);

/**
 * Recebe os itens marcados no assistente de orçamento e cria, para cada um,
 * uma DESPESA "prevista / a definir" no Financeiro — já com a categoria certa.
 * Nunca inventa valor. Ignora itens que já existem (mesma descrição, não
 * excluídos) para permitir reabrir o assistente sem duplicar.
 */
export async function gerarDespesasDoOrcamento(_prev: OrcamentoState, formData: FormData): Promise<OrcamentoState> {
  const marcados = formData.getAll("item").map(String).filter((v) => VALIDOS.has(v));
  if (marcados.length === 0) return { ok: false, message: "Selecione ao menos um item." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  // Descrições já existentes (não duplicar).
  const { data: existentes } = await supabase
    .from("hg_expenses")
    .select("descricao")
    .is("deleted_at", null);
  const jaTem = new Set((existentes ?? []).map((e) => String(e.descricao).trim().toLowerCase()));

  const novas = marcados
    .map((v) => {
      const [categoria, nome] = v.split("|||");
      return { categoria, nome };
    })
    .filter((x) => x.nome && !jaTem.has(x.nome.trim().toLowerCase()));

  if (novas.length === 0) {
    return { ok: true, message: "Todos os itens selecionados já estavam no financeiro." };
  }

  const { error } = await supabase.from("hg_expenses").insert(
    novas.map((x) => ({
      descricao: x.nome,
      categoria: x.categoria,
      estado: "previsto",
      gratuito: false,
      valor_total_cents: null, // "a definir" — o casal informa depois (regra 11)
      observacao: "Adicionado pelo assistente de orçamento.",
    })),
  );

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };

  await logAudit(supabase, {
    modulo: "orcamento",
    acao: "gerar_despesas",
    valorNovo: { quantidade: novas.length },
  });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/financeiro-dashboard");
  return {
    ok: true,
    message: `${novas.length} item(ns) adicionado(s) ao financeiro como "previsto / a definir".`,
  };
}
