"use client";

import { useState, useEffect } from "react";

/**
 * Campo de hora com máscara manual (HH:MM), sem depender do picker nativo
 * do navegador — o usuário digita só números e a formatação acontece sozinha.
 */
export function InputHora({
  name,
  required,
  defaultValue = "",
  className = "",
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  const [valor, setValor] = useState(defaultValue);

  useEffect(() => {
    setValor(defaultValue);
  }, [defaultValue]);

  function formatar(digitado: string) {
    // Mantém só números, no máximo 4 dígitos (HHMM)
    const numeros = digitado.replace(/\D/g, "").slice(0, 4);

    if (numeros.length <= 2) {
      return numeros;
    }
    return `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValor(formatar(e.target.value));
  }

  function handleBlur() {
    // Ao sair do campo, valida e corrige horas/minutos fora do intervalo
    const [hStr, mStr] = valor.split(":");
    if (!hStr) return;

    let h = Math.min(parseInt(hStr || "0", 10), 23);
    let m = mStr !== undefined ? Math.min(parseInt(mStr || "0", 10), 59) : undefined;

    const hFormatado = h.toString().padStart(2, "0");
    const mFormatado = m !== undefined ? m.toString().padStart(2, "0") : "00";

    setValor(mStr !== undefined ? `${hFormatado}:${mFormatado}` : hFormatado);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      required={required}
      value={valor}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="00:00"
      maxLength={5}
      className={className}
    />
  );
}