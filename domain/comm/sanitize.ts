/**
 * Segurança da IA (§28): antes de enviar contexto ao provedor, seleciona SOMENTE
 * os campos permitidos e remove qualquer dado privado. A interface mostra o que
 * foi enviado e o que foi removido por privacidade.
 */

/**
 * Categorias SEMPRE proibidas, independentemente do prompt (§28, regra 33).
 * Mesmo que apareçam em "permitido", são removidas.
 */
export const CATEGORIAS_SEMPRE_PROIBIDAS = [
  "financeiro",
  "valor_presente",
  "valor",
  "observacoes_internas",
  "observacao_interna",
  "tokens",
  "token",
  "documentos",
  "documento",
  "dados_saude",
  "saude",
  "credenciais",
  "senha",
  "dados_de_outras_familias",
] as const;

export interface SanitizeResult {
  enviado: Record<string, unknown>;
  removido: string[]; // chaves removidas (por não permitidas ou proibidas)
  categoriasEnviadas: string[];
}

/**
 * Filtra os dados de contexto:
 *  1. mantém apenas chaves em `permitido`;
 *  2. remove qualquer chave em `proibido` ou nas sempre-proibidas;
 *  3. descarta valores vazios/nulos;
 *  4. reporta o que foi removido.
 */
export function sanitizeContext(
  dados: Record<string, unknown>,
  opts: { permitido: string[]; proibido?: string[] },
): SanitizeResult {
  const permitido = new Set(opts.permitido.map((k) => k.toLowerCase()));
  const proibido = new Set(
    [...(opts.proibido ?? []), ...CATEGORIAS_SEMPRE_PROIBIDAS].map((k) => k.toLowerCase()),
  );

  const enviado: Record<string, unknown> = {};
  const removido: string[] = [];

  for (const [chaveOrig, valor] of Object.entries(dados)) {
    const chave = chaveOrig.toLowerCase();
    const vazio = valor === null || valor === undefined || valor === "";
    if (proibido.has(chave)) {
      removido.push(chaveOrig);
      continue;
    }
    if (!permitido.has(chave)) {
      removido.push(chaveOrig);
      continue;
    }
    if (vazio) continue; // não envia vazio, mas também não conta como removido por privacidade
    enviado[chaveOrig] = valor;
  }

  return {
    enviado,
    removido: [...new Set(removido)],
    categoriasEnviadas: Object.keys(enviado),
  };
}

/** True se algum campo proibido está presente e preenchido (para bloquear envio — §31.10/11). */
export function contemDadoProibido(
  dados: Record<string, unknown>,
  proibidoExtra: string[] = [],
): boolean {
  const proibido = new Set(
    [...proibidoExtra, ...CATEGORIAS_SEMPRE_PROIBIDAS].map((k) => k.toLowerCase()),
  );
  return Object.entries(dados).some(
    ([k, v]) => proibido.has(k.toLowerCase()) && v !== null && v !== undefined && v !== "",
  );
}
