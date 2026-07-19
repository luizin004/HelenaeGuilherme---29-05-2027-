/**
 * Tipos do banco de dados.
 * Reflete supabase/migrations/0001_init.sql.
 * Em produção, regenerar com:
 *   supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

export type StatusConvidado = "pendente" | "confirmado" | "recusado";
export type Lado = "noiva" | "noivo" | "ambos";
export type StatusPagamento =
  | "pendente" | "confirmado" | "recebido" | "estornado" | "cancelado" | "falhou";
export type MetodoPagamento = "pix" | "cartao" | "boleto";

export interface WeddingSettings {
  id: number;
  noiva: string;
  noivo: string;
  data_casamento: string;
  hashtag: string | null;
  historia: string | null;
  cor_primaria: string | null;
  rsvp_prazo: string | null;
  atualizado_em: string;
}

export interface Venue {
  id: string;
  tipo: "cerimonia" | "recepcao" | "outro";
  nome: string;
  endereco: string | null;
  cidade: string | null;
  horario: string | null;
  latitude: number | null;
  longitude: number | null;
  maps_url: string | null;
  ordem: number;
}

export interface StoryEvent {
  id: string;
  ano: string | null;
  titulo: string;
  descricao: string | null;
  ordem: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  legenda: string | null;
  ordem: number;
  criado_em: string;
}

export interface Guest {
  id: string;
  group_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  eh_crianca: boolean;
  faixa_etaria: string | null;
  lado: Lado | null;
  status: StatusConvidado;
  respondeu_em: string | null;
  mensagem: string | null;
  restricao_alimentar: string | null;
  transporte: string | null;
  qr_token: string;
  mesa: string | null;
  check_in_em: string | null;
  check_in_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Gift {
  id: string;
  category_id: string | null;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  preco: number;
  permite_cota: boolean;
  quantidade: number | null;
  status: "disponivel" | "reservado" | "adquirido";
  ordem: number;
  criado_em: string;
}

export interface Payment {
  id: string;
  gift_id: string | null;
  guest_id: string | null;
  pagador_nome: string | null;
  pagador_email: string | null;
  pagador_telefone: string | null;
  mensagem: string | null;
  valor: number;
  metodo: MetodoPagamento | null;
  provedor: string;
  asaas_payment_id: string | null;
  asaas_customer_id: string | null;
  invoice_url: string | null;
  pix_qr_code: string | null;
  pix_copia_cola: string | null;
  status: StatusPagamento;
  pago_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Checkin {
  id: string;
  guest_id: string;
  check_in_em: string;
  registrado_por: string | null;
  observacao: string | null;
}

/** Tabela genérica tipada para o supabase-js (Row/Insert/Update/Relationships). */
type Tbl<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

/** Estrutura consumida pelo supabase-js (expansível conforme os módulos avançam). */
export interface Database {
  public: {
    Tables: {
      wedding_settings: Tbl<WeddingSettings>;
      venues: Tbl<Venue>;
      story_events: Tbl<StoryEvent>;
      gallery_photos: Tbl<GalleryPhoto>;
      guests: Tbl<Guest>;
      gifts: Tbl<Gift>;
      payments: Tbl<Payment>;
      checkins: Tbl<Checkin>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
