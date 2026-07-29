"use client";

import type { ChangeEvent, ComponentPropsWithoutRef } from "react";
import { useState } from "react";
import { formatCents } from "@/domain/money";

type MoneyInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "inputMode"
> & {
  /** Valor inicial em centavos (ex.: edição de um registro já salvo). */
  defaultValueCents?: number | null;
};

/**
 * Campo de texto que formata o valor como moeda (R$ 1.234,56) a cada
 * tecla digitada — os dígitos informados são sempre lidos da direita
 * para a esquerda (centavos primeiro), como em apps bancários.
 * O `name` do input recebe o texto já formatado; `parseBRLToCents`
 * (usada em todas as actions) entende esse formato normalmente.
 */
export function MoneyInput({ defaultValueCents, ...props }: MoneyInputProps) {
  const [valor, setValor] = useState(() =>
    defaultValueCents ? formatCents(defaultValueCents) : "",
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, "");
    setValor(digitos ? formatCents(Number(digitos)) : "");
  }

  return <input {...props} type="text" inputMode="decimal" value={valor} onChange={handleChange} />;
}
