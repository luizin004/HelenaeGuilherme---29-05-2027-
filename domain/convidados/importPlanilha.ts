/**
 * Importação assistida da planilha de casamento (FASE 10).
 *
 * A planilha original tem 1 nome por linha (coluna A) e um RÓTULO de convite/kit
 * (coluna B) que, quando são várias pessoas no mesmo convite, fica MESCLADO — ou
 * seja, o rótulo aparece só na primeira linha do grupo e as seguintes vêm em
 * branco. Ao copiar do Excel/Sheets, esse padrão vira "rótulo na 1ª linha, vazio
 * nas demais" — que é exatamente o que reconstruímos aqui por "fill-down".
 *
 * Nada é vinculado automaticamente: casais de padrinhos são apenas SUGERIDOS.
 * Funções puras e testáveis. O usuário revê a prévia antes de salvar.
 */

export interface LinhaPlanilha {
  nome: string;
  rotulo: string;
}

export type TipoGrupo = "familiar" | "casal" | "solo" | "padrinhos" | "personalizado";

export interface MembroDraft {
  nome: string;
  papel: "convidado" | "padrinho";
}

export interface GrupoDraft {
  nomeImpressao: string;
  tipo: TipoGrupo;
  kit: string;
  ehPadrinhos: boolean;
  sugestaoCasal: boolean; // grupo de padrinhos com exatamente 2 pessoas
  ambiguo: boolean; // grupo de padrinhos com mais de 2 pessoas → revisar
  membros: MembroDraft[];
}

export interface ImportPreview {
  grupos: GrupoDraft[];
  totalPessoas: number;
  totalPadrinhos: number;
  casaisSugeridos: number;
  semPar: number;
  totalGrupos: number;
  possiveisCaixas: number;
  linhasIgnoradas: number;
}

const CABECALHO = new Set(["convidados", "convidado", "nome", "name", "grupo", "pessoa", "pessoas"]);
const GENERICOS = ["caixa padrinhos", "caixa convite", "convite", "caixa"];

function limpar(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Divide uma linha em [nome, rótulo] aceitando tab, ; ou , como separador. */
function dividir(linha: string): [string, string] {
  const delim = linha.includes("\t") ? "\t" : linha.includes(";") ? ";" : ",";
  const partes = linha.split(delim);
  return [limpar(partes[0] ?? ""), limpar(partes.slice(1).join(delim))];
}

/** Lê o texto colado em linhas [nome, rótulo], ignorando cabeçalho e vazios. */
export function parseLinhas(texto: string): LinhaPlanilha[] {
  const out: LinhaPlanilha[] = [];
  for (const bruta of texto.split(/\r?\n/)) {
    if (!bruta.trim()) continue;
    const [nome, rotulo] = dividir(bruta);
    if (!nome) continue;
    // Cabeçalho "Convidados" (sem rótulo) é ignorado.
    if (!rotulo && CABECALHO.has(nome.toLowerCase())) continue;
    out.push({ nome, rotulo });
  }
  return out;
}

function ehGenerico(rotulo: string): boolean {
  const r = rotulo.toLowerCase();
  return GENERICOS.some((g) => r === g || r.startsWith(g));
}

/** Sugere um nome de impressão a partir do rótulo (ou dos nomes, se genérico). */
function nomeImpressao(rotulo: string, membros: MembroDraft[]): string {
  if (rotulo && !ehGenerico(rotulo)) return rotulo; // "Tia Elen e família", "Pedro e Júlia"
  return membros.map((m) => m.nome).join(" e "); // genérico → nomes dos integrantes
}

/** Infere o tipo/kit do grupo a partir do rótulo e da quantidade de pessoas. */
function classificar(rotulo: string, n: number): { tipo: TipoGrupo; kit: string; ehPadrinhos: boolean } {
  const r = rotulo.toLowerCase();
  if (r.includes("padrinho")) {
    return { tipo: "padrinhos", kit: n === 1 ? "padrinhos_individual" : "padrinhos_casal", ehPadrinhos: true };
  }
  // "A e B" (dois primeiros nomes, sem "família") com 2 pessoas → casal.
  const pareceCasal = / e /i.test(rotulo) && !/fam[ií]lia/i.test(rotulo) && n === 2;
  if (pareceCasal) return { tipo: "casal", kit: "familiar", ehPadrinhos: false };
  if (n === 1 && ehGenerico(rotulo)) return { tipo: "solo", kit: "solo", ehPadrinhos: false };
  return { tipo: "familiar", kit: "familiar", ehPadrinhos: false };
}

/**
 * Monta a prévia agrupando por "fill-down": um rótulo não-vazio inicia um grupo;
 * linhas seguintes com rótulo vazio entram no mesmo grupo (célula mesclada).
 */
export function montarPreview(linhas: LinhaPlanilha[]): ImportPreview {
  const grupos: GrupoDraft[] = [];
  let atualNomes: string[] = [];
  let atualRotulo = "";
  let linhasIgnoradas = 0;

  const fechar = () => {
    if (atualNomes.length === 0) return;
    const { tipo, kit, ehPadrinhos } = classificar(atualRotulo, atualNomes.length);
    const membros: MembroDraft[] = atualNomes.map((nome) => ({ nome, papel: ehPadrinhos ? "padrinho" : "convidado" }));
    grupos.push({
      nomeImpressao: nomeImpressao(atualRotulo, membros),
      tipo,
      kit,
      ehPadrinhos,
      sugestaoCasal: ehPadrinhos && atualNomes.length === 2,
      ambiguo: ehPadrinhos && atualNomes.length > 2,
      membros,
    });
    atualNomes = [];
    atualRotulo = "";
  };

  for (const l of linhas) {
    if (l.rotulo) {
      // Novo grupo.
      fechar();
      atualRotulo = l.rotulo;
      atualNomes = [l.nome];
    } else if (atualNomes.length > 0) {
      // Continua o grupo mesclado.
      atualNomes.push(l.nome);
    } else {
      // Pessoa antes de qualquer rótulo → grupo próprio (solo).
      atualRotulo = "";
      atualNomes = [l.nome];
      fechar();
    }
  }
  fechar();

  const totalPessoas = grupos.reduce((n, g) => n + g.membros.length, 0);
  const totalPadrinhos = grupos.reduce((n, g) => n + g.membros.filter((m) => m.papel === "padrinho").length, 0);
  const casaisSugeridos = grupos.filter((g) => g.sugestaoCasal).length;
  const semPar = totalPadrinhos - casaisSugeridos * 2;
  const possiveisCaixas = grupos.filter((g) => g.ehPadrinhos).length;

  return {
    grupos,
    totalPessoas,
    totalPadrinhos,
    casaisSugeridos,
    semPar,
    totalGrupos: grupos.length,
    possiveisCaixas,
    linhasIgnoradas,
  };
}

/** Atalho: texto colado → prévia. */
export function previewPlanilha(texto: string): ImportPreview {
  return montarPreview(parseLinhas(texto));
}

// ————————————————————————————————————————————————— Lista rápida

export interface PessoaRapida {
  nome: string;
  ehCrianca: boolean;
}

export interface ListaRapidaPreview {
  pessoas: PessoaRapida[];
  total: number;
  adultos: number;
  criancas: number;
}

// Marcadores de criança no fim da linha: (c), (crianca), (criança), " - crianca".
const MARCA_CRIANCA = /\s*(?:\((?:c|crian[cç]a)\)|[-–]\s*crian[cç]a)\s*$/i;

/**
 * Lista rápida: uma pessoa por linha. Para marcar criança, basta terminar a
 * linha com "(c)" ou "(criança)". Ideal para "ir digitando todo mundo" e depois
 * vincular às famílias. Sempre devolve o total e a contagem de crianças.
 */
export function parseListaRapida(texto: string): ListaRapidaPreview {
  const vistos = new Set<string>();
  const pessoas: PessoaRapida[] = [];
  for (const bruta of texto.split(/\r?\n/)) {
    let linha = bruta.trim();
    if (!linha) continue;
    const ehCrianca = MARCA_CRIANCA.test(linha);
    linha = limpar(linha.replace(MARCA_CRIANCA, ""));
    if (!linha) continue;
    const chave = linha.toLowerCase();
    if (vistos.has(chave)) continue; // evita duplicar no próprio lote
    vistos.add(chave);
    pessoas.push({ nome: linha, ehCrianca });
  }
  return {
    pessoas,
    total: pessoas.length,
    adultos: pessoas.filter((p) => !p.ehCrianca).length,
    criancas: pessoas.filter((p) => p.ehCrianca).length,
  };
}
