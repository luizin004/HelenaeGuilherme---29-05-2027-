/**
 * Cliente mínimo da API do Asaas (server-only).
 * Docs: https://docs.asaas.com
 */
const BASE_URL = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3";
const API_KEY = process.env.ASAAS_API_KEY ?? "";

export const isAsaasConfigured = Boolean(API_KEY);

async function asaas<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Asaas ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface AsaasCustomer { id: string }
export interface AsaasPayment { id: string; invoiceUrl: string; status: string }
export interface AsaasPix { encodedImage?: string; payload?: string }

export function createCustomer(input: { name: string; email?: string; mobilePhone?: string }) {
  return asaas<AsaasCustomer>("/customers", { method: "POST", body: JSON.stringify(input) });
}

export function createPayment(input: {
  customer: string;
  billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
  value: number;
  dueDate: string;
  description: string;
}) {
  return asaas<AsaasPayment>("/payments", { method: "POST", body: JSON.stringify(input) });
}

export function getPixQrCode(paymentId: string) {
  return asaas<AsaasPix>(`/payments/${paymentId}/pixQrCode`, { method: "GET" });
}
