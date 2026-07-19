import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCustomer, createPayment, getPixQrCode, isAsaasConfigured } from "@/lib/asaas";

export const runtime = "nodejs";

interface Body {
  gift_id?: string;
  valor: number;
  metodo?: "PIX" | "CREDIT_CARD" | "BOLETO";
  pagador: { nome: string; email?: string; telefone?: string };
  mensagem?: string;
}

/** Cria a cobrança do presente no Asaas e registra em `payments`. */
export async function POST(req: Request) {
  if (!isAsaasConfigured) {
    return NextResponse.json({ error: "Pagamentos ainda não configurados." }, { status: 503 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { gift_id, valor, metodo = "PIX", pagador, mensagem } = body;
  if (!valor || valor <= 0 || !pagador?.nome) {
    return NextResponse.json({ error: "Informe valor e nome do pagador." }, { status: 400 });
  }

  try {
    const customer = await createCustomer({
      name: pagador.nome,
      email: pagador.email,
      mobilePhone: pagador.telefone,
    });

    const cobranca = await createPayment({
      customer: customer.id,
      billingType: metodo,
      value: valor,
      dueDate: new Date().toISOString().slice(0, 10),
      description: "Presente de casamento — Helena & Guilherme",
    });

    const pix = metodo === "PIX" ? await getPixQrCode(cobranca.id) : {};

    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("hg_payments").insert({
        gift_id: gift_id ?? null,
        pagador_nome: pagador.nome,
        pagador_email: pagador.email ?? null,
        pagador_telefone: pagador.telefone ?? null,
        mensagem: mensagem ?? null,
        valor,
        metodo: metodo === "CREDIT_CARD" ? "cartao" : metodo === "BOLETO" ? "boleto" : "pix",
        asaas_payment_id: cobranca.id,
        asaas_customer_id: customer.id,
        invoice_url: cobranca.invoiceUrl,
        pix_qr_code: (pix as { encodedImage?: string }).encodedImage ?? null,
        pix_copia_cola: (pix as { payload?: string }).payload ?? null,
        status: "pendente",
      });
    }

    return NextResponse.json({
      ok: true,
      invoiceUrl: cobranca.invoiceUrl,
      pix: {
        qrCode: (pix as { encodedImage?: string }).encodedImage,
        copiaECola: (pix as { payload?: string }).payload,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
