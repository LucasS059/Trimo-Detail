// components/public/agendamentos/confirmacao-agendamento.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function ConfirmacaoAgendamento({ slugLoja, brand }: { slugLoja: string; brand: string }) {
  return (
    <div
      className="border rounded-2xl p-6 text-center"
      style={{ backgroundColor: `${brand}14`, borderColor: `${brand}59` }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: brand }}
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <p className="font-bold text-white text-base">Agendamento confirmado!</p>
      <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
        Você vai receber a confirmação por WhatsApp com o link de acompanhamento.
      </p>
      <Link
        href={`/${slugLoja}/meus-agendamentos`}
        className="inline-flex items-center gap-1 mt-4 text-sm font-semibold"
        style={{ color: brand }}
      >
        Ver meus agendamentos
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
