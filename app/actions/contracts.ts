"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseBRLToCents } from "@/domain/money";

export interface ContractFormState {
  ok: boolean;
  message: string;
}

/** Cadastra um contrato, opcionalmente ligado a um fornecedor. */
export async function criarContrato(
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "");
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const dataEvento = String(formData.get("data_evento") ?? "").trim();

  if (!titulo) return { ok: false, message: "Informe o título do contrato." };

  let valor = 0;
  if (valorRaw) {
    try {
      valor = parseBRLToCents(valorRaw) / 100; // hg_contracts.valor é numeric(12,2)
    } catch {
      return { ok: false, message: "Valor inválido." };
    }
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_contracts").insert({
    titulo,
    supplier_id: supplierId || null,
    valor,
    data_evento: dataEvento || null,
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  revalidatePath("/admin/contratos");
  return { ok: true, message: `Contrato "${titulo}" cadastrado.` };
}
