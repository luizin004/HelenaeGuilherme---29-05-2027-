/**
 * Catálogo de itens que um casamento pode ter (assistente de orçamento).
 * Serve para o casal SELECIONAR o que quer cotar/contratar — cada item
 * selecionado vira uma despesa "prevista / a definir" no Financeiro, já com a
 * categoria certa. Nada de valores aqui: o sistema nunca inventa preço.
 *
 * `essencial: true` marca itens que a maioria dos casamentos precisa — usado só
 * para sugerir, nunca para obrigar.
 */

export interface CatalogoItem {
  nome: string;
  essencial?: boolean;
}

export interface CatalogoGrupo {
  categoria: string;
  icone: string;
  itens: CatalogoItem[];
}

export const CATALOGO: CatalogoGrupo[] = [
  {
    categoria: "Planejamento & Cerimonial",
    icone: "📋",
    itens: [
      { nome: "Assessoria completa", essencial: true },
      { nome: "Cerimonial do dia", essencial: true },
      { nome: "Coordenação de fornecedores" },
      { nome: "Protocolo da cerimônia" },
      { nome: "Equipe de apoio" },
    ],
  },
  {
    categoria: "Documentação",
    icone: "📄",
    itens: [
      { nome: "Casamento civil" },
      { nome: "Taxas de cartório" },
      { nome: "Documentação religiosa" },
      { nome: "Curso de noivos" },
      { nome: "Seguro do evento" },
      { nome: "Alvarás e autorizações" },
      { nome: "ECAD (direitos musicais)" },
    ],
  },
  {
    categoria: "Cerimônia",
    icone: "⛪",
    itens: [
      { nome: "Celebrante / Padre", essencial: true },
      { nome: "Decoração da cerimônia" },
      { nome: "Flores da cerimônia" },
      { nome: "Altar" },
      { nome: "Passadeira / tapete" },
      { nome: "Cadeiras da cerimônia" },
      { nome: "Sonorização da cerimônia" },
      { nome: "Músicos da cerimônia" },
      { nome: "Cantor da igreja" },
      { nome: "Porta-alianças" },
      { nome: "Lembrança da cerimônia" },
    ],
  },
  {
    categoria: "Espaço & Estrutura",
    icone: "🏕️",
    itens: [
      { nome: "Aluguel do espaço", essencial: true },
      { nome: "Tenda / cobertura" },
      { nome: "Estrutura para chuva" },
      { nome: "Gerador" },
      { nome: "Banheiros químicos" },
      { nome: "Climatização" },
      { nome: "Iluminação de ambiente" },
      { nome: "Mobília e cadeiras" },
      { nome: "Limpeza" },
      { nome: "Segurança" },
      { nome: "Manobrista" },
      { nome: "Sinalização" },
      { nome: "Acessibilidade" },
    ],
  },
  {
    categoria: "Buffet & Gastronomia",
    icone: "🍽️",
    itens: [
      { nome: "Buffet principal", essencial: true },
      { nome: "Churrasco fogo de chão" },
      { nome: "Churrasqueiro" },
      { nome: "Entradas" },
      { nome: "Mesa gourmet" },
      { nome: "Pizza volante" },
      { nome: "Estação de massas" },
      { nome: "Doces finos" },
      { nome: "Bem-casados" },
      { nome: "Bolo", essencial: true },
      { nome: "Açaí" },
      { nome: "Sorvete" },
      { nome: "Comida da madrugada" },
      { nome: "Cardápio infantil" },
      { nome: "Alimentação de fornecedores" },
      { nome: "Opções vegetarianas / veganas" },
    ],
  },
  {
    categoria: "Bebidas",
    icone: "🥂",
    itens: [
      { nome: "Água, refrigerante e suco" },
      { nome: "Cerveja" },
      { nome: "Chopp" },
      { nome: "Espumante" },
      { nome: "Vinhos" },
      { nome: "Destilados" },
      { nome: "Bar e barman" },
      { nome: "Gelo" },
      { nome: "Taças e copos" },
    ],
  },
  {
    categoria: "Decoração",
    icone: "🌿",
    itens: [
      { nome: "Projeto decorativo", essencial: true },
      { nome: "Flores e arranjos" },
      { nome: "Enxoval de mesa (toalhas)" },
      { nome: "Louças e sousplats" },
      { nome: "Lounges" },
      { nome: "Painel / cenário" },
      { nome: "Mesa do bolo" },
      { nome: "Mesa de doces" },
      { nome: "Velas" },
      { nome: "Iluminação decorativa" },
      { nome: "Decoração dos banheiros" },
      { nome: "Espaço de fotos" },
    ],
  },
  {
    categoria: "Música & Entretenimento",
    icone: "🎶",
    itens: [
      { nome: "Banda", essencial: true },
      { nome: "DJ" },
      { nome: "Som e palco" },
      { nome: "Iluminação de pista" },
      { nome: "Painel de LED" },
      { nome: "Pista de dança" },
      { nome: "Efeitos / máquina de fumaça" },
      { nome: "Cabine de fotos" },
      { nome: "Plataforma 360" },
      { nome: "Recreadores / monitores" },
      { nome: "Parquinho infantil" },
    ],
  },
  {
    categoria: "Fotografia & Vídeo",
    icone: "📸",
    itens: [
      { nome: "Fotógrafo", essencial: true },
      { nome: "Segundo fotógrafo" },
      { nome: "Filmmaker / vídeo" },
      { nome: "Drone" },
      { nome: "Ensaio pré-wedding" },
      { nome: "Making of" },
      { nome: "Álbum" },
      { nome: "Teaser" },
      { nome: "Transmissão ao vivo" },
      { nome: "Impressão instantânea" },
    ],
  },
  {
    categoria: "Noiva",
    icone: "👰",
    itens: [
      { nome: "Vestido de casamento", essencial: true },
      { nome: "Segundo vestido" },
      { nome: "Ajustes do vestido" },
      { nome: "Sapato" },
      { nome: "Acessórios e joias" },
      { nome: "Véu" },
      { nome: "Maquiagem e cabelo", essencial: true },
      { nome: "Dia da noiva" },
      { nome: "Buquê" },
      { nome: "Tratamentos estéticos" },
    ],
  },
  {
    categoria: "Noivo",
    icone: "🤵",
    itens: [
      { nome: "Traje do noivo", essencial: true },
      { nome: "Camisa e gravata" },
      { nome: "Sapato" },
      { nome: "Acessórios" },
      { nome: "Cabelo e barba" },
      { nome: "Dia do noivo" },
    ],
  },
  {
    categoria: "Padrinhos & Família",
    icone: "💐",
    itens: [
      { nome: "Convites dos padrinhos" },
      { nome: "Presentes dos padrinhos" },
      { nome: "Lembranças da família" },
      { nome: "Flores das mães e madrinhas" },
    ],
  },
  {
    categoria: "Papelaria & Comunicação",
    icone: "✉️",
    itens: [
      { nome: "Identidade visual e monograma" },
      { nome: "Save the date" },
      { nome: "Convite físico" },
      { nome: "Convite digital" },
      { nome: "Site do casamento" },
      { nome: "Menu" },
      { nome: "Numeração de mesas" },
      { nome: "Placas e sinalização" },
      { nome: "Tags e cartões" },
      { nome: "QR Codes" },
    ],
  },
  {
    categoria: "Convidados",
    icone: "🎟️",
    itens: [
      { nome: "Hospedagem de convidados" },
      { nome: "Transporte / van" },
      { nome: "Traslado" },
      { nome: "Kit de boas-vindas" },
      { nome: "Lembrancinhas" },
      { nome: "Kit banheiro" },
      { nome: "Kit conforto (leque, chinelo)" },
      { nome: "Espaço infantil e monitores" },
    ],
  },
  {
    categoria: "Lua de mel",
    icone: "✈️",
    itens: [
      { nome: "Passagens" },
      { nome: "Hospedagem" },
      { nome: "Seguro viagem" },
      { nome: "Passeios e experiências" },
      { nome: "Traslados" },
    ],
  },
  {
    categoria: "Tecnologia & Operação",
    icone: "🛠️",
    itens: [
      { nome: "Sistema de convidados" },
      { nome: "Check-in e QR Code" },
      { nome: "Internet / Wi-Fi" },
      { nome: "Rádios comunicadores" },
      { nome: "Suporte técnico no dia" },
    ],
  },
  {
    categoria: "Outros & Reservas",
    icone: "📦",
    itens: [
      { nome: "Taxas e gorjetas" },
      { nome: "Horas extras" },
      { nome: "Fretes" },
      { nome: "Montagem e desmontagem" },
      { nome: "Deslocamento e combustível" },
      { nome: "Imprevistos" },
    ],
  },
];

/** Lista simples de categorias (para selects/datalists no Financeiro). */
export const CATEGORIAS: string[] = CATALOGO.map((g) => g.categoria);

/** Total de itens no catálogo (para exibição). */
export const TOTAL_ITENS_CATALOGO = CATALOGO.reduce((n, g) => n + g.itens.length, 0);
