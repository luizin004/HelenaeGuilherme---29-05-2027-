/**
 * Slug determinístico do presente → nome do arquivo de imagem.
 * "Cantinho do café da nossa casa" → "cantinho-do-cafe-da-nossa-casa"
 * A foto é procurada em /public/images/presentes/<slug>.jpg — basta subir o
 * arquivo com esse nome e ela aparece sozinha (sem cadastro manual).
 */
export function giftSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
