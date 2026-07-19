/**
 * Sugestões de hospedagem para os convidados (dados fornecidos pelo casal).
 * As fachadas ficam em `public/images/hoteis/` — enquanto não existirem, o card
 * mostra um gradiente da paleta. Valores/disponibilidade são confirmados com cada hotel.
 */

export interface Hotel {
  id: string;
  nome: string;
  imagem: string;
  descricao: string;
  endereco: string;
  telefone: string;
  whatsapp?: string;
  mapsUrl: string;
}

export const HOTEIS: Hotel[] = [
  {
    id: "it-itabira-hotel",
    nome: "IT Itabira Hotel",
    imagem: "/images/hoteis/it-itabira-hotel.jpg",
    descricao: "Uma opção completa e confortável para convidados que desejam praticidade durante a estadia.",
    endereco: "Avenida Duque de Caxias, 1.220 – Esplanada da Estação, Itabira/MG",
    telefone: "(31) 3833-4050",
    whatsapp: "5531997588743",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=IT+Itabira+Hotel%2C+Avenida+Duque+de+Caxias%2C+1220%2C+Itabira+MG",
  },
  {
    id: "premium-executive-hotel",
    nome: "Premium Executive Hotel",
    imagem: "/images/hoteis/premium-executive-hotel.jpg",
    descricao: "Hotel moderno, com perfil executivo e localização estratégica para os convidados.",
    endereco: "Avenida Vereador Osório Sampaio, 45 – Vila Santa Rosa, Itabira/MG",
    telefone: "(31) 3835-8000",
    whatsapp: "553138358002",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Premium+Executive+Hotel%2C+Avenida+Vereador+Osorio+Sampaio%2C+45%2C+Itabira+MG",
  },
  {
    id: "hotel-domus-itabira",
    nome: "Hotel Domus Itabira",
    imagem: "/images/hoteis/hotel-domus-itabira.jpg",
    descricao: "Alternativa prática para famílias e convidados que chegam à cidade de carro.",
    endereco: "Rua Malacacheta, 16 – Major Lage de Baixo, Itabira/MG",
    telefone: "(31) 3835-1955",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Domus+Itabira%2C+Rua+Malacacheta%2C+16%2C+Itabira+MG",
  },
  {
    id: "pousada-agua-santa",
    nome: "Hotel Pousada da Água Santa",
    imagem: "/images/hoteis/pousada-agua-santa.jpg",
    descricao: "Hospedagem central e acolhedora, próxima ao comércio e aos principais serviços.",
    endereco: "Rua Água Santa, 2 – Centro, Itabira/MG",
    telefone: "(31) 3831-3920",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Pousada+da+Agua+Santa%2C+Rua+Agua+Santa%2C+2%2C+Itabira+MG",
  },
];

/** Link de contato: WhatsApp com mensagem pronta, ou telefone se não houver WhatsApp. */
export function hotelContato(h: Hotel): { href: string; externo: boolean; label: string } {
  if (h.whatsapp) {
    const msg = encodeURIComponent(
      `Olá! Sou convidado(a) do casamento de Helena e Guilherme e gostaria de verificar disponibilidade, valores e condições de hospedagem no ${h.nome}.`,
    );
    return { href: `https://wa.me/${h.whatsapp}?text=${msg}`, externo: true, label: "Falar no WhatsApp" };
  }
  return { href: `tel:${h.telefone.replace(/\D/g, "")}`, externo: false, label: "Ligar para o hotel" };
}
