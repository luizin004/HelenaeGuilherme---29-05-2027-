/**
 * Modelo do documento de autorização — a parte EDITÁVEL.
 *
 * Os dados (casal, evento, fornecedor, parcelas, nota fiscal) sempre vêm do
 * sistema. Aqui ficam só os textos e a composição visual, para os noivos
 * ajustarem o documento sem conseguir quebrá-lo: campo vazio cai no padrão,
 * e os marcadores são substituídos pelos dados reais na hora de gerar.
 *
 * Módulo puro: sem banco, sem React.
 */

export interface ModeloDocumento {
  cabecalho_titulo: string | null;
  cabecalho_legenda: string | null;
  titulo: string | null;
  declaracao: string | null;
  rodape: string | null;
  assinatura_1: string | null;
  assinatura_2: string | null;
  rotulo_contratantes: string | null;
  rotulo_contratado: string | null;
  rotulo_objeto: string | null;
  rotulo_pagamento: string | null;
  rotulo_nota_fiscal: string | null;
  rotulo_observacoes: string | null;
  mostrar_monograma: boolean;
  mostrar_evento: boolean;
  mostrar_objeto: boolean;
  mostrar_nota_fiscal: boolean;
  mostrar_declaracao: boolean;
  mostrar_assinaturas: boolean;
  mostrar_rodape: boolean;
  cor_destaque: string;
}

/** Textos e composição de fábrica — o documento "que já vem pronto". */
export const MODELO_PADRAO: ModeloDocumento = {
  cabecalho_titulo: "Casamento {{noivos}}",
  cabecalho_legenda: "{{data}} · {{local}}",
  titulo: "Aprovação de orçamento e autorização de contratação",
  declaracao:
    "Aprovamos o orçamento acima e autorizamos a contratação nas condições descritas. " +
    "Solicitamos o envio do contrato para assinatura, contemplando o mesmo escopo, valor e " +
    "cronograma de pagamento aqui registrados.",
  rodape: "{{noivos}} · {{data}} · Documento {{numero}}",
  assinatura_1: "Contratante",
  assinatura_2: "Contratado",
  rotulo_contratantes: "Contratantes",
  rotulo_contratado: "Contratado (fornecedor)",
  rotulo_objeto: "Objeto — o que está sendo contratado",
  rotulo_pagamento: "Valor e forma de pagamento",
  rotulo_nota_fiscal: "Nota fiscal",
  rotulo_observacoes: "Observações e condições gerais",
  mostrar_monograma: true,
  mostrar_evento: true,
  mostrar_objeto: true,
  mostrar_nota_fiscal: true,
  mostrar_declaracao: true,
  mostrar_assinaturas: true,
  mostrar_rodape: true,
  cor_destaque: "gold",
};

/** Marcadores aceitos nos textos do modelo (mostrados na ajuda do editor). */
export const MARCADORES = [
  { chave: "{{noivos}}", descricao: "Helena & Guilherme" },
  { chave: "{{noiva}}", descricao: "nome da noiva" },
  { chave: "{{noivo}}", descricao: "nome do noivo" },
  { chave: "{{data}}", descricao: "data do casamento por extenso" },
  { chave: "{{local}}", descricao: "cidade do casamento" },
  { chave: "{{numero}}", descricao: "número do documento (AC-2026-0001)" },
  { chave: "{{emissao}}", descricao: "data de emissão do documento" },
  { chave: "{{fornecedor}}", descricao: "nome do fornecedor" },
  { chave: "{{objeto}}", descricao: "o que está sendo contratado" },
  { chave: "{{valor}}", descricao: "valor total aprovado" },
] as const;

export type VariaveisDocumento = Record<string, string>;

/**
 * Substitui os marcadores pelos dados reais. Marcador desconhecido é mantido
 * como está — melhor mostrar `{{xpto}}` do que apagar texto silenciosamente.
 */
export function aplicarMarcadores(texto: string, vars: VariaveisDocumento): string {
  return texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (original, chave: string) =>
    chave in vars ? vars[chave] : original,
  );
}

/** Preenche os campos vazios com o padrão (o editor nunca deixa o doc oco). */
export function resolverModelo(modelo: Partial<ModeloDocumento> | null): ModeloDocumento {
  if (!modelo) return { ...MODELO_PADRAO };
  const resolvido = { ...MODELO_PADRAO };
  for (const chave of Object.keys(MODELO_PADRAO) as (keyof ModeloDocumento)[]) {
    const valor = modelo[chave];
    if (typeof valor === "boolean") {
      (resolvido[chave] as boolean) = valor;
    } else if (typeof valor === "string" && valor.trim() !== "") {
      (resolvido[chave] as string) = valor;
    }
  }
  return resolvido;
}

/** Texto do modelo já resolvido: padrão quando vazio + marcadores aplicados. */
export function textoDoModelo(
  modelo: ModeloDocumento,
  campo: keyof ModeloDocumento,
  vars: VariaveisDocumento,
): string {
  const valor = modelo[campo];
  const base = typeof valor === "string" && valor.trim() !== "" ? valor : String(MODELO_PADRAO[campo] ?? "");
  return aplicarMarcadores(base, vars);
}

/** Classes da cor de destaque — fixas para o Tailwind não perder na build. */
const CORES: Record<string, { texto: string; borda: string; fundoSuave: string }> = {
  gold: { texto: "text-gold", borda: "border-gold", fundoSuave: "bg-gold-soft" },
  olive: { texto: "text-olive", borda: "border-olive", fundoSuave: "bg-[#eef1e6]" },
  moss: { texto: "text-moss", borda: "border-moss", fundoSuave: "bg-cream" },
};

export const CORES_DISPONIVEIS = [
  { valor: "gold", nome: "Dourado" },
  { valor: "olive", nome: "Oliva" },
  { valor: "moss", nome: "Musgo" },
] as const;

export function classesDestaque(cor: string) {
  return CORES[cor] ?? CORES.gold;
}
