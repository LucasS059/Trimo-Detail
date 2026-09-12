"use client";

import { useState, useTransition, useRef } from "react";
import { uploadImagemLojaAction } from "@/lib/actions/upload";
import { comprimirImagem } from "@/lib/utils/comprimir-imagem";
import { salvarConfiguracoesAction, salvarHorariosFuncionamentoAction } from "@/lib/actions/configuracoes";
import { toast } from "sonner";
import { 
  Store, 
  Clock, 
  CreditCard, 
  CalendarCog, 
  Globe, 
  Palette, 
  Info,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Loader2
} from "lucide-react";

type Loja = {
  nome: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  endereco: string | null;
  antecedencia_minima_minutos: number;
  prazo_cancelamento_minutos: number;
  lembrete_confirmacao_minutos: number;
  dias_futuros_visiveis: number;
  mercadopago_user_id: string | null;
  mercadopago_device_id: string | null;
  taxa_debito_percentual: number;
  taxa_credito_percentual: number;
  tem_mercadopago_configurado: boolean;
  fuso_horario: string;
  cor_primaria: string;
};

type Horario = {
  dia_semana: number;
  hora_abertura: string;
  hora_fechamento: string;
  fechado: boolean;
};

type Aba = "geral" | "horarios" | "pagamentos" | "regras" | "fuso" | "personalizacao";

const CORES_SUGERIDAS = [
  "#E56B25", "#2563EB", "#16A34A", "#DC2626", "#9333EA", "#0891B2", "#DB2777", "#18181B",
];

const DIAS_SEMANA = [
  { id: 0, nome: "Domingo" },
  { id: 1, nome: "Segunda-feira" },
  { id: 2, nome: "Terça-feira" },
  { id: 3, nome: "Quarta-feira" },
  { id: 4, nome: "Quinta-feira" },
  { id: 5, nome: "Sexta-feira" },
  { id: 6, nome: "Sábado" },
];

const FUSOS_BRASIL = [
  { id: "America/Sao_Paulo", nome: "Horário de Brasília (SP, RJ, MG, Sul, Nordeste, GO, DF, TO)" },
  { id: "America/Manaus", nome: "Amazonas - Manaus e Leste (-04:00)" },
  { id: "America/Cuiaba", nome: "Mato Grosso e Mato Grosso do Sul (-04:00)" },
  { id: "America/Belem", nome: "Pará e Amapá (-03:00)" },
  { id: "America/Fortaleza", nome: "Ceará, Maranhão, Piauí, RN (-03:00)" },
  { id: "America/Recife", nome: "Pernambuco, Alagoas, Sergipe, Paraíba (-03:00)" },
  { id: "America/Porto_Velho", nome: "Rondônia (-04:00)" },
  { id: "America/Boa_Vista", nome: "Roraima (-04:00)" },
  { id: "America/Rio_Branco", nome: "Acre e Extremo Oeste (-05:00)" },
  { id: "America/Noronha", nome: "Fernando de Noronha (-02:00)" },
];

const MENU_CONFIGURACOES: { id: Aba; titulo: string; icone: React.ComponentType<{ className?: string }> }[] = [
  { id: "geral", titulo: "Dados da Loja", icone: Store },
  { id: "horarios", titulo: "Horários de Funcionamento", icone: Clock },
  { id: "pagamentos", titulo: "Meios de Pagamento", icone: CreditCard },
  { id: "regras", titulo: "Regras da Agenda", icone: CalendarCog },
  { id: "fuso", titulo: "Fuso Horário", icone: Globe },
  { id: "personalizacao", titulo: "Identidade Visual", icone: Palette },
];

export function ConfiguracoesForm({ loja, horariosIniciais }: { loja: Loja; horariosIniciais: Horario[] }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...loja, mercadopago_access_token: "" });
  const [horarios, setHorarios] = useState<Horario[]>(horariosIniciais);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("regras");
  
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [previewImagem, setPreviewImagem] = useState<string | null>(loja.imagem_url);
  const inputImagemRef = useRef<HTMLInputElement>(null);
  const [copiado, setCopiado] = useState(false);

  function copiarLink() {
    const url = `${window.location.origin}/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    toast.success("Link da loja copiado!");
    setTimeout(() => setCopiado(false), 2500);
  }

  async function handleSelecionarImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    setEnviandoImagem(true);
    try {
      const arquivoComprimido = await comprimirImagem(file);
      const formData = new FormData();
      formData.append("arquivo", arquivoComprimido);

      const res = await uploadImagemLojaAction(formData);
      if (!res || !res.url) {
        toast.error("Falha ao enviar imagem.");
        return;
      }

      setPreviewImagem(res.url);
      setForm((prev) => ({ ...prev, imagem_url: res.url }));
      toast.success("Foto atualizada com sucesso!");
    } catch {
      toast.error("Erro ao processar imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  function campoForm(chave: string, valor: unknown) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  function atualizarHorarioDia(dia: number, campoChave: keyof Horario, valor: unknown) {
    setHorarios((atual) =>
      atual.map((h) => (h.dia_semana === dia ? { ...h, [campoChave]: valor } : h))
    );
  }

  function handleSalvarGeral(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { tem_mercadopago_configurado, ...dados } = form;
      const res = await salvarConfiguracoesAction(dados);
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      toast.success("Dados da loja salvos com sucesso!");
    });
  }

  function handleSalvarHorarios(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const resHorarios = await salvarHorariosFuncionamentoAction(horarios);
      if (!resHorarios.sucesso) {
        toast.error(resHorarios.erro);
        return;
      }
      toast.success("Horários de funcionamento atualizados!");
    });
  }

  function handleSalvarPagamentos(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { tem_mercadopago_configurado, ...dados } = form;
      const res = await salvarConfiguracoesAction(dados);
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      setForm((atual) => ({ ...atual, mercadopago_access_token: "" }));
      toast.success("Configurações de pagamento salvas!");
    });
  }

  function handleSalvarRegras(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { tem_mercadopago_configurado, ...dados } = form;
      const res = await salvarConfiguracoesAction(dados);
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      toast.success("Regras da agenda atualizadas com sucesso!");
    });
  }

  function handleSalvarPersonalizacao(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await salvarConfiguracoesAction({ cor_primaria: form.cor_primaria });
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      toast.success("Identidade visual salva com sucesso!");
    });
  }

  function handleSalvarFuso(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await salvarConfiguracoesAction({ fuso_horario: form.fuso_horario });
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      toast.success("Fuso horário da estética atualizado com sucesso!");
    });
  }

  return (
    <div className="space-y-6">
      
      {/* BARRA SUPERIOR COMPACTA DO LINK PÚBLICO */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-zinc-400 block">Página pública de agendamento</span>
            <span className="text-sm font-semibold text-white truncate block mt-0.5">
              trimodetail.com.br/{form.slug}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copiarLink}
            className="h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors inline-flex items-center gap-1.5"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            {copiado ? "Copiado!" : "Copiar link"}
          </button>
          <a
            href={`/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            Ver loja
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: SIDEBAR DE CONFIGURAÇÕES + CONTEÚDO */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        
        {/* SIDEBAR DE NAVEGAÇÃO INTERNA (ÚNICA E LIMPA) */}
        <aside className="w-full lg:w-60 shrink-0">
          <nav className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 space-y-1">
            {MENU_CONFIGURACOES.map((item) => {
              const Icone = item.icone;
              const ativo = abaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAbaAtiva(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-semibold transition-colors ${
                    ativo
                      ? "bg-zinc-800 text-white shadow-xs border-l-2 border-[#E56B25]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  <Icone className={`w-4 h-4 shrink-0 ${ativo ? "text-[#E56B25]" : "text-zinc-400"}`} />
                  <span className="truncate">{item.titulo}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* PAINEL DE CONTEÚDO */}
        <div className="flex-1 w-full min-w-0">

          {/* 1. DADOS DA LOJA */}
          {abaAtiva === "geral" && (
            <form onSubmit={handleSalvarGeral} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 space-y-5">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white">Dados da Estética</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Informações visíveis aos seus clientes na página de agendamento.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Nome da estética</label>
                  <input
                    value={form.nome}
                    onChange={(e) => campoForm("nome", e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Link público (slug)</label>
                  <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-950 px-3 h-10 focus-within:border-[#E56B25] transition-colors">
                    <span className="text-xs text-zinc-500 select-none mr-1">trimodetail.com.br/</span>
                    <input
                      value={form.slug}
                      onChange={(e) => campoForm("slug", e.target.value)}
                      className="w-full bg-transparent text-white text-sm outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Endereço da oficina</label>
                <input
                  value={form.endereco ?? ""}
                  onChange={(e) => campoForm("endereco", e.target.value)}
                  placeholder="Ex: Av. das Américas, 1500 - Barra da Tijuca, Rio de Janeiro"
                  className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Sobre a estética (descrição)</label>
                <textarea
                  value={form.descricao ?? ""}
                  onChange={(e) => campoForm("descricao", e.target.value)}
                  rows={3}
                  placeholder="Descreva a especialidade da estética, serviços premium oferecidos e diferenciais..."
                  className="w-full p-3 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 h-10 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Dados
                </button>
              </div>
            </form>
          )}

          {/* 2. EXPEDIENTE E HORÁRIOS */}
          {abaAtiva === "horarios" && (
            <form onSubmit={handleSalvarHorarios} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 space-y-5">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white">Horários de Funcionamento</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Dias e horários em que a estética está aberta para atendimento online.</p>
              </div>

              <div className="space-y-2.5">
                {DIAS_SEMANA.map((diaInfo) => {
                  const h = horarios.find((item) => item.dia_semana === diaInfo.id) || {
                    dia_semana: diaInfo.id,
                    hora_abertura: "08:00",
                    hora_fechamento: "18:00",
                    fechado: true,
                  };
                  return (
                    <div
                      key={diaInfo.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-3 sm:w-44 shrink-0">
                        <input
                          type="checkbox"
                          id={`dia_${diaInfo.id}`}
                          checked={!h.fechado}
                          onChange={(e) => atualizarHorarioDia(diaInfo.id, "fechado", !e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#E56B25] focus:ring-[#E56B25] accent-[#E56B25] cursor-pointer"
                        />
                        <label htmlFor={`dia_${diaInfo.id}`} className="text-sm font-semibold text-white cursor-pointer select-none">
                          {diaInfo.nome}
                        </label>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-1 sm:justify-end">
                        {h.fechado ? (
                          <span className="text-xs font-semibold text-zinc-500 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
                            Fechado neste dia
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Das</span>
                            <input
                              type="time"
                              value={h.hora_abertura ? h.hora_abertura.substring(0, 5) : "08:00"}
                              onChange={(e) => atualizarHorarioDia(diaInfo.id, "hora_abertura", e.target.value)}
                              className="h-8 px-2 rounded border border-zinc-700 bg-zinc-900 text-white text-xs outline-none focus:border-[#E56B25] [color-scheme:dark]"
                            />
                            <span className="text-xs text-zinc-400">até</span>
                            <input
                              type="time"
                              value={h.hora_fechamento ? h.hora_fechamento.substring(0, 5) : "18:00"}
                              onChange={(e) => atualizarHorarioDia(diaInfo.id, "hora_fechamento", e.target.value)}
                              className="h-8 px-2 rounded border border-zinc-700 bg-zinc-900 text-white text-xs outline-none focus:border-[#E56B25] [color-scheme:dark]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 h-10 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Horários
                </button>
              </div>
            </form>
          )}

          {/* 3. MEIOS DE PAGAMENTO */}
          {abaAtiva === "pagamentos" && (
            <form onSubmit={handleSalvarPagamentos} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white">Meios de Pagamento</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Integrações de pagamento com Mercado Pago (Pix automático e maquininhas Point).</p>
              </div>

              {/* Seção Pix */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Recebimento via Pix Automático</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Permite ao cliente pagar com QR Code instantâneo com baixa automática.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Access Token do Mercado Pago</label>
                  <input
                    type="password"
                    value={form.mercadopago_access_token}
                    onChange={(e) => campoForm("mercadopago_access_token", e.target.value)}
                    placeholder={form.tem_mercadopago_configurado ? "•••••••••••• (Já configurado)" : "APP_USR-xxxxxx..."}
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                  />
                  {form.tem_mercadopago_configurado && (
                    <p className="text-xs text-emerald-400 mt-1.5 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Token ativo e configurado com sucesso.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">User ID do Mercado Pago</label>
                  <input
                    value={form.mercadopago_user_id ?? ""}
                    onChange={(e) => campoForm("mercadopago_user_id", e.target.value)}
                    placeholder="Ex: 123456789"
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                  />
                </div>
              </div>

              {/* Seção Maquininha Point */}
              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Maquininha Point (Opcional)</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Envie o valor do serviço diretamente para o visor da sua maquininha.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Device ID da Maquininha</label>
                  <input
                    value={form.mercadopago_device_id ?? ""}
                    onChange={(e) => campoForm("mercadopago_device_id", e.target.value)}
                    placeholder="Ex: POINT_SMART_123456"
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                  />
                </div>
              </div>

              {/* Seção Taxas */}
              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Taxas das Operações de Cartão</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Usadas no painel financeiro para calcular o lucro líquido real.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Taxa de Débito (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.taxa_debito_percentual ?? 1.99}
                      onChange={(e) => campoForm("taxa_debito_percentual", Number(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Taxa de Crédito à Vista (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.taxa_credito_percentual ?? 4.98}
                      onChange={(e) => campoForm("taxa_credito_percentual", Number(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 h-10 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Pagamentos
                </button>
              </div>
            </form>
          )}

          {/* 4. REGRAS DA AGENDA */}
          {abaAtiva === "regras" && (
            <form onSubmit={handleSalvarRegras} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white">Regras de Agendamento</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Prazos de antecedência, regras de cancelamento e lembretes aos clientes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Antecedência mínima para agendar (minutos)
                  </label>
                  <input
                    type="number"
                    value={form.antecedencia_minima_minutos}
                    onChange={(e) => campoForm("antecedencia_minima_minutos", Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                  />
                  <p className="text-xs text-zinc-400">Ex: 60 minutos impede agendamentos de última hora sem aviso prévio.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Prazo limite para cancelamento (minutos)
                  </label>
                  <input
                    type="number"
                    value={form.prazo_cancelamento_minutos}
                    onChange={(e) => campoForm("prazo_cancelamento_minutos", Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                  />
                  <p className="text-xs text-zinc-400">Até quanto tempo antes do horário o cliente pode cancelar online.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Lembrete de confirmação no WhatsApp (minutos antes)
                  </label>
                  <input
                    type="number"
                    value={form.lembrete_confirmacao_minutos}
                    onChange={(e) => campoForm("lembrete_confirmacao_minutos", Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                  />
                  <p className="text-xs text-zinc-400">Tempo de antecedência para disparo automático do lembrete.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Dias futuros visíveis para agendamento
                  </label>
                  <input
                    type="number"
                    value={form.dias_futuros_visiveis}
                    onChange={(e) => campoForm("dias_futuros_visiveis", Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors"
                  />
                  <p className="text-xs text-zinc-400">Ex: 15 dias limita a agenda online às próximas duas semanas.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 h-10 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Regras
                </button>
              </div>
            </form>
          )}

          {/* 5. FUSO HORÁRIO */}
          {abaAtiva === "fuso" && (
            <form onSubmit={handleSalvarFuso} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white">Fuso Horário Operacional</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Garante que abertura, fechamento e horários livres respeitem o relógio da sua oficina.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Fuso horário da oficina</label>
                <select
                  value={form.fuso_horario ?? "America/Sao_Paulo"}
                  onChange={(e) => campoForm("fuso_horario", e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25] transition-colors cursor-pointer"
                >
                  {FUSOS_BRASIL.map((fuso) => (
                    <option key={fuso.id} value={fuso.id} className="bg-zinc-900 text-white">
                      {fuso.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Info className="w-4 h-4 text-[#E56B25]" />
                  <span>Como funciona o fuso horário no Trimo Detail:</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed">
                  <li>• <strong>Gravação Global (UTC):</strong> Todo agendamento é salvo com precisão universal, protegido contra mudanças de relógio.</li>
                  <li>• <strong>Horário da Oficina:</strong> Um agendamento das 14h será rigorosamente às 14h no relógio do seu estabelecimento.</li>
                  <li>• <strong>Dispositivo do Cliente:</strong> Mesmo que o cliente acesse de outro estado, a reserva respeita a hora local da sua loja.</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 h-10 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Fuso Horário
                </button>
              </div>
            </form>
          )}

          {/* 6. IDENTIDADE VISUAL */}
          {abaAtiva === "personalizacao" && (
            <form onSubmit={handleSalvarPersonalizacao} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white">Identidade Visual da Loja</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Personalize a foto e a cor de destaque da sua página pública.</p>
              </div>

              {/* Foto da estética */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">Foto / Logotipo da estética</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 shrink-0 flex items-center justify-center">
                    {previewImagem ? (
                      <img src={previewImagem} alt="Foto da loja" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={inputImagemRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleSelecionarImagem}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => inputImagemRef.current?.click()}
                      disabled={enviandoImagem}
                      className="h-9 px-3.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2 w-fit"
                    >
                      {enviandoImagem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {enviandoImagem ? "Enviando..." : "Alterar foto"}
                    </button>
                    <span className="text-xs text-zinc-400">JPG, PNG ou WEBP até 5MB</span>
                  </div>
                </div>
              </div>

              {/* Cor primária */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 block">Cor de destaque</label>
                
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.cor_primaria || "#E56B25"}
                    onChange={(e) => campoForm("cor_primaria", e.target.value)}
                    className="w-10 h-10 rounded border border-zinc-700 bg-zinc-950 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={form.cor_primaria || "#E56B25"}
                    onChange={(e) => campoForm("cor_primaria", e.target.value)}
                    className="h-10 w-28 px-3 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-sm outline-none focus:border-[#E56B25]"
                    placeholder="#E56B25"
                    maxLength={7}
                  />

                  <div className="flex items-center gap-1.5 ml-2">
                    {CORES_SUGERIDAS.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => campoForm("cor_primaria", cor)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-105 ${
                          form.cor_primaria === cor ? "border-white" : "border-transparent"
                        }`}
                        style={{ backgroundColor: cor }}
                        title={cor}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Prévia da cor */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 max-w-sm">
                <span className="text-[11px] font-semibold text-zinc-500 block mb-2">Exemplo na página do cliente:</span>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg text-white text-xs font-bold shadow-xs"
                  style={{ backgroundColor: form.cor_primaria || "#E56B25" }}
                >
                  Confirmar Agendamento
                </button>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 h-10 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Cor
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
