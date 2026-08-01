/**
 * Regras puras do álbum colaborativo "Nossa Festa".
 *
 * Tudo aqui é determinístico e sem I/O: validação dos arquivos que o convidado
 * escolheu, montagem dos caminhos no bucket e os textos de agradecimento.
 * As mesmas regras estão replicadas na função `hg_festa_enviar` (migration
 * 0017) — aqui elas existem para dar erro *antes* de subir 15 MB à toa.
 */

/** Formatos aceitos. Fora disso, o arquivo é recusado com motivo explicado. */
export const TIPOS_ACEITOS = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

/** Quantas fotos cabem em um envio. */
export const MAX_ARQUIVOS = 15;

/** Tamanho máximo por arquivo (15 MB). */
export const MAX_BYTES = 15 * 1024 * 1024;

export interface ArquivoEscolhido {
  nome: string;
  tipo: string;
  tamanho: number;
}

export interface ArquivoRecusado {
  nome: string;
  motivo: string;
}

export interface TriagemLote {
  aceitos: ArquivoEscolhido[];
  recusados: ArquivoRecusado[];
}

/** Formata bytes em MB com uma casa — só para a mensagem de erro. */
function emMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Valida um arquivo isolado. Devolve o motivo em português, pronto para a tela
 * — o convidado precisa saber o que fazer, não o código do erro.
 */
export function validarArquivo(a: ArquivoEscolhido): string | null {
  const tipo = (a.tipo ?? "").toLowerCase();
  if (!TIPOS_ACEITOS.includes(tipo as (typeof TIPOS_ACEITOS)[number])) {
    return "só aceitamos JPG, PNG ou WEBP";
  }
  if (a.tamanho <= 0) return "arquivo vazio";
  if (a.tamanho > MAX_BYTES) return `passa de 15 MB (tem ${emMB(a.tamanho)})`;
  return null;
}

/**
 * Triagem do que o convidado acabou de escolher, considerando o que já estava
 * selecionado (o limite de 15 vale para o envio inteiro, não por clique).
 */
export function triarLote(escolhidos: ArquivoEscolhido[], jaSelecionados = 0): TriagemLote {
  const aceitos: ArquivoEscolhido[] = [];
  const recusados: ArquivoRecusado[] = [];

  for (const a of escolhidos) {
    const motivo = validarArquivo(a);
    if (motivo) {
      recusados.push({ nome: a.nome, motivo });
      continue;
    }
    if (jaSelecionados + aceitos.length >= MAX_ARQUIVOS) {
      recusados.push({ nome: a.nome, motivo: `só cabem ${MAX_ARQUIVOS} fotos por envio` });
      continue;
    }
    aceitos.push(a);
  }

  return { aceitos, recusados };
}

/** Nome de arquivo seguro para o storage (sem acento, espaço ou barra). */
export function nomeSeguro(nome: string): string {
  const limpo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-]/g, "_")
    .replace(/_+/g, "_")
    // Sem "..": a barra já virou "_", mas o ponto duplo não tem por que ficar.
    .replace(/\.{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "");
  return limpo || "foto.jpg";
}

/** Caminho na fila de moderação. Nada aqui é legível publicamente. */
export function caminhoPendente(lote: string, indice: number, nome: string): string {
  return `pendentes/${lote}/${String(indice).padStart(2, "0")}-${nomeSeguro(nome)}`;
}

/** Caminho depois de aprovado — único prefixo com leitura liberada. */
export function caminhoAprovado(pendente: string): string {
  return pendente.startsWith("pendentes/")
    ? `aprovadas/${pendente.slice("pendentes/".length)}`
    : `aprovadas/${pendente}`;
}

/** Só o primeiro nome, para o agradecimento soar como conversa. */
export function primeiroNome(autor: string): string {
  const partes = autor.trim().split(/\s+/);
  return partes[0] ?? "";
}

/** Mensagem de sucesso depois do envio. */
export function mensagemAgradecimento(autor: string, quantidade: number): string {
  const nome = primeiroNome(autor);
  const fotos = quantidade === 1 ? "sua foto" : `suas ${quantidade} fotos`;
  const abertura = nome ? `Obrigado, ${nome}!` : "Obrigado!";
  return `${abertura} Guardamos ${fotos} com carinho. Assim que a gente olhar, elas entram na galeria com o seu nome. 💛`;
}

/**
 * Deixa só os dígitos do telefone. Devolve "" quando não sobra um número
 * plausível — assim o botão de WhatsApp simplesmente não aparece em vez de
 * levar o convidado a um link quebrado.
 */
export function normalizarWhatsapp(numero: string | null | undefined): string {
  const digitos = (numero ?? "").replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 15 ? digitos : "";
}

/** Link wa.me pronto, ou null quando o número ainda não foi configurado. */
export function linkWhatsapp(numero: string | null | undefined, mensagem?: string | null): string | null {
  const limpo = normalizarWhatsapp(numero);
  if (!limpo) return null;
  const texto = (mensagem ?? "").trim();
  return texto ? `https://wa.me/${limpo}?text=${encodeURIComponent(texto)}` : `https://wa.me/${limpo}`;
}

/** Endereço público da aba, usado no comunicado da Evania e no QR. */
export function linkDaAba(base: string): string {
  return `${base.replace(/\/+$/, "")}/nossa-festa`;
}

/**
 * Texto do comunicado que a Evania dispara depois da festa. O link entra
 * inteiro no corpo — é ele que faz a pessoa lembrar de mandar as fotos.
 */
export function comunicadoNossaFesta(link: string): string {
  return [
    "Oi, {{nome}}! 💛",
    "",
    "A festa acabou, mas as lembranças não. Vocês viram coisas que a gente não viu — e o fotógrafo também não.",
    "",
    `Manda pra gente as fotos que você tirou no nosso casamento: ${link}`,
    "",
    "É rapidinho: escolhe as fotos, escreve seu nome e envia. Cada foto entra na galeria do site com o crédito de quem clicou.",
    "",
    "Obrigado por ter estado com a gente. — Helena e Guilherme",
  ].join("\n");
}
