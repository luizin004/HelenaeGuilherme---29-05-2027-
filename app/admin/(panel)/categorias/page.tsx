import { redirect } from "next/navigation";

/** Centros de custo e Categorias foram unificados em Classificações financeiras (§5). */
export default function CategoriasRedirect() {
  redirect("/admin/classificacoes");
}
