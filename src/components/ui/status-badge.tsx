export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    agendado: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    em_andamento: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    aguardando_pagamento: "bg-[#E56B25]/15 text-[#E56B25] border-[#E56B25]/30",
    concluido: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cancelado: "bg-red-500/15 text-red-400 border-red-500/30",
    nao_compareceu: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
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