// ============================================================
// Edge Function — Criação de cobrança no Asaas (presentes)
// ------------------------------------------------------------
// Esqueleto pronto para ativação. Fluxo:
//   1. Convidado escolhe um presente/cota no site público.
//   2. Frontend chama esta função com { gift_id, valor, pagador }.
//   3. Função cria (ou reutiliza) o cliente e a cobrança no Asaas.
//   4. Salva o registro em `payments` e devolve o link/PIX.
//   5. O webhook do Asaas (outra função) confirma o pagamento.
//
// Segredos necessários (supabase secrets set ...):
//   ASAAS_API_KEY, ASAAS_BASE_URL (https://api.asaas.com/v3
//   ou https://sandbox.asaas.com/api/v3), SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const ASAAS_BASE_URL = Deno.env.get("ASAAS_BASE_URL") ?? "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { gift_id, valor, metodo = "PIX", pagador, mensagem } = await req.json();

    if (!valor || !pagador?.nome) {
      return json({ error: "Dados incompletos" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Cliente Asaas
    const customer = await asaas("/customers", {
      name: pagador.nome,
      email: pagador.email,
      mobilePhone: pagador.telefone,
    });

    // 2) Cobrança
    const cobranca = await asaas("/payments", {
      customer: customer.id,
      billingType: metodo,               // PIX | CREDIT_CARD | BOLETO
      value: valor,
      dueDate: new Date().toISOString().slice(0, 10),
      description: `Presente de casamento — Helena & Guilherme`,
    });

    // 3) PIX (se aplicável)
    let pix: { encodedImage?: string; payload?: string } = {};
    if (metodo === "PIX") {
      pix = await asaas(`/payments/${cobranca.id}/pixQrCode`, null, "GET");
    }

    // 4) Persistência
    await supabase.from("payments").insert({
      gift_id,
      pagador_nome: pagador.nome,
      pagador_email: pagador.email,
      pagador_telefone: pagador.telefone,
      mensagem,
      valor,
      metodo: metodo.toLowerCase() === "credit_card" ? "cartao" : metodo.toLowerCase(),
      asaas_payment_id: cobranca.id,
      asaas_customer_id: customer.id,
      invoice_url: cobranca.invoiceUrl,
      pix_qr_code: pix.encodedImage,
      pix_copia_cola: pix.payload,
      status: "pendente",
    });

    return json({
      ok: true,
      invoiceUrl: cobranca.invoiceUrl,
      pix: { qrCode: pix.encodedImage, copiaECola: pix.payload },
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

async function asaas(path: string, body: unknown, method = "POST") {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Asaas ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
