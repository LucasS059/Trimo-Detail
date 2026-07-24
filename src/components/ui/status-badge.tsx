export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    agendado: "bg-blue-100 text-blue-700 border-blue-200",
    em_andamento: "bg-yellow-100 text-yellow-700 border-yellow-200",
    aguardando_pagamento: "bg-orange-100 text-orange-700 border-orange-200",
    concluido: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelado: "bg-red-100 text-red-700 border-red-200",
    nao_compareceu: "bg-zinc-100 text-zinc-700 border-zinc-200",
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
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.agendado}`}>
      {labels[status] || status}
    </span>
  );
}