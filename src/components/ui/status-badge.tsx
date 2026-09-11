export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    agendado: "bg-blue-600 text-white border-blue-500",
    em_andamento: "bg-amber-400 text-zinc-950 font-bold border-amber-300",
    aguardando_pagamento: "bg-[#E56B25] text-white border-orange-500",
    concluido: "bg-emerald-600 text-white border-emerald-500",
    cancelado: "bg-red-600 text-white border-red-500",
    nao_compareceu: "bg-zinc-600 text-white border-zinc-500",
  };

  const labels: Record<string, string> = {
    agendado: "Agendado",
    em_andamento: "Em Andamento",
    aguardando_pagamento: "Pagamento Pendente",
    concluido: "Concluído",
    cancelado: "Cancelado",
    nao_compareceu: "Faltou",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide border shadow-xs ${
        styles[status] || styles.agendado
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
