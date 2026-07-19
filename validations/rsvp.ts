import { z } from "zod";

/** Schema de validação do RSVP público (servidor e cliente). */
export const rsvpSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  email: z.string().trim().email("E-mail inválido.").max(160).optional().or(z.literal("")),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  acompanhantes: z.coerce.number().int().min(0).max(20).default(0),
  presenca: z.enum(["sim", "nao"], { errorMap: () => ({ message: "Diga se poderá comparecer." }) }),
  mensagem: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
