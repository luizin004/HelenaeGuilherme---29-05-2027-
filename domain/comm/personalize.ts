/**
 * Personalização humana das mensagens (§12).
 * Regras: usar o nome/tratamento autorizado com naturalidade, sem repetir de
 * forma artificial; nunca inventar apelido ou intimidade. Quando não houver
 * nome autorizado, cair num tratamento neutro aprovado.
 */

export interface NomeCtx {
  nome?: string | null;
  nomePreferido?: string | null;
  apelidoAutorizado?: string | null;
  tratamentoNeutro?: string | null; // ex.: "Olá" quando nada for autorizado
}

/** Primeiro nome a partir do nome completo. */
export function firstName(nome?: string | null): string {
  if (!nome) return "";
  return nome.trim().split(/\s+/)[0] ?? "";
}

/**
 * Forma de tratamento preferida, na ordem: apelido autorizado → nome preferido →
 * primeiro nome → tratamento neutro. Nunca inventa apelido.
 */
export function nomeDeTratamento(ctx: NomeCtx): string {
  const apelido = ctx.apelidoAutorizado?.trim();
  const preferido = ctx.nomePreferido?.trim();
  const primeiro = firstName(ctx.nome);
  return apelido || preferido || primeiro || (ctx.tratamentoNeutro?.trim() || "Olá");
}

/** Saudação para uma família: "Família Silva, ...". */
export function saudacaoFamilia(sobrenome?: string | null): string {
  const s = sobrenome?.trim();
  return s ? `Família ${s}` : "Olá";
}

/** Saudação para dupla/casal: "Carlos e Mariana". */
export function saudacaoDupla(a?: string | null, b?: string | null): string {
  const na = firstName(a);
  const nb = firstName(b);
  if (na && nb) return `${na} e ${nb}`;
  return na || nb || "Olá";
}

/**
 * Substitui variáveis {{chave}} pelo valor. Variáveis sem valor viram string
 * vazia e são reportadas — a interface deve impedir enviar com obrigatória vazia (§31.9).
 */
export function aplicarVariaveis(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): { texto: string; faltando: string[] } {
  const faltando: string[] = [];
  const texto = template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, chave: string) => {
    const v = vars[chave];
    if (v === undefined || v === null || v === "") {
      faltando.push(chave);
      return "";
    }
    return String(v);
  });
  return { texto, faltando: [...new Set(faltando)] };
}

/**
 * Detecta repetição artificial do nome (§12): o mesmo nome citado mais de duas
 * vezes, ou duas vezes seguidas ("Carlos, olá Carlos"). Serve de aviso na revisão.
 */
export function repeticaoArtificialDoNome(texto: string, nome?: string | null): boolean {
  const alvo = firstName(nome);
  if (!alvo) return false;
  const re = new RegExp(`\\b${alvo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  const ocorrencias = texto.match(re)?.length ?? 0;
  if (ocorrencias > 2) return true;
  // duas ocorrências muito próximas (até 12 caracteres entre elas)
  const seguidas = new RegExp(
    `\\b${alvo}\\b[\\s\\S]{0,12}\\b${alvo}\\b`,
    "i",
  );
  return seguidas.test(texto);
}
