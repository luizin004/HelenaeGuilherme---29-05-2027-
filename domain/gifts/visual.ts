/**
 * Capa temática para o card de presente quando NÃO há foto (imagem_url).
 * Escolhe um ícone e um gradiente na paleta HG a partir de palavras-chave do
 * nome — mantém a lista bonita e coerente enquanto as fotos reais não entram.
 * Assim que `imagem_url` é preenchido, a foto substitui a capa.
 *
 * Padrão visual pedido pelo casal: tons off-white, areia, verde-oliva, madeira
 * e dourado fosco; proporção 4:5; sem texto na imagem.
 */

export interface GiftVisual {
  emoji: string;
  from: string; // cor inicial do gradiente
  to: string; // cor final do gradiente
}

// Paleta (mesma do tailwind.config)
const OLIVE = "#6f7352";
const OLIVE_LIGHT = "#8f9470";
const MOSS = "#4b5540";
const GOLD = "#b89b6a";
const GOLD_SOFT = "#d9c8a4";
const SAND = "#ded2ba";
const WOOD = "#8a7359";

interface Regra {
  re: RegExp;
  emoji: string;
  from: string;
  to: string;
}

// Primeira regra que casar vence — do mais específico ao mais genérico.
const REGRAS: Regra[] = [
  { re: /pizza/i, emoji: "🍕", from: GOLD, to: WOOD },
  { re: /churrasc|parrilla|fogo de ch/i, emoji: "🔥", from: WOOD, to: MOSS },
  { re: /caf[ée]|manh[ãa]/i, emoji: "☕", from: GOLD_SOFT, to: WOOD },
  { re: /brinde|espumante|ta[çc]a|adega|vinho|bar\b/i, emoji: "🥂", from: GOLD, to: OLIVE },
  { re: /piquenique/i, emoji: "🧺", from: OLIVE_LIGHT, to: OLIVE },
  { re: /geladeira|mercado|delivery|compra/i, emoji: "🛒", from: SAND, to: OLIVE_LIGHT },
  { re: /jantar|almo[çc]o|gastron|restaurante|lou[çc]a|jantar/i, emoji: "🍽️", from: GOLD_SOFT, to: OLIVE },
  { re: /filme|cinema/i, emoji: "🎬", from: MOSS, to: OLIVE },
  { re: /spa|descanso|relax/i, emoji: "🧖", from: GOLD_SOFT, to: OLIVE_LIGHT },
  { re: /jardim|paisagismo/i, emoji: "🌿", from: OLIVE_LIGHT, to: MOSS },
  { re: /ilumina[çc]/i, emoji: "💡", from: GOLD, to: GOLD_SOFT },
  { re: /gourmet|m[óo]veis|churrasqueira|espa[çc]o/i, emoji: "🛋️", from: WOOD, to: OLIVE },
  { re: /decora|ambiente|lar|projeto|reforma|obra/i, emoji: "🏡", from: SAND, to: OLIVE },
  { re: /jogo de cama|quarto|di[áa]ria|hotel|su[íi]te/i, emoji: "🛏️", from: GOLD_SOFT, to: WOOD },
  { re: /lua de mel|viagem|passagem|passeio|aventura|destino|final de semana|upgrade|experi[êe]ncia|resort/i, emoji: "✈️", from: OLIVE, to: MOSS },
  { re: /futuro|capital|cota|sonho/i, emoji: "✨", from: GOLD, to: MOSS },
];

export function giftVisual(nome: string): GiftVisual {
  for (const r of REGRAS) {
    if (r.re.test(nome)) return { emoji: r.emoji, from: r.from, to: r.to };
  }
  return { emoji: "🎁", from: GOLD, to: OLIVE };
}
