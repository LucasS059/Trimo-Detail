"use client";

import { useState, useTransition, useRef } from "react";
import { uploadImagemLojaAction } from "@/lib/actions/upload";
import { comprimirImagem } from "@/lib/utils/comprimir-imagem";
import { salvarConfiguracoesAction, salvarHorariosFuncionamentoAction } from "@/lib/actions/configuracoes";
import { toast } from "sonner";

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

type Aba = "geral" | "horarios" | "pagamentos" | "regras" | "personalizacao";

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

const campo = {
  label: "text-[11px] font-semibold uppercase tracking-wider text-white",
  input: "w-full h-10 px-3 mt-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-sm",
  textarea: "w-full p-3 mt-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-sm resize-none",
};

export function ConfiguracoesForm({ loja, horariosIniciais }: { loja: Loja; horariosIniciais: Horario[] }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...loja, mercadopago_access_token: "" });
  const [horarios, setHorarios] = useState<Horario[]>(horariosIniciais);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("geral");
  const tabsRef = useRef<HTMLDivElement>(null);
  const arrastando = useRef(false);
  const inicioX = useRef(0);
  const scrollInicial = useRef(0);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [previewImagem, setPreviewImagem] = useState<string | null>(loja.imagem_url);
  const inputImagemRef = useRef<HTMLInputElement>(null);

  async function handleSelecionarImagem(e: React.ChangeEvent<HTMLInputElement>) {
  const arquivoOriginal = e.target.files?.[0];
  if (!arquivoOriginal) return;

  setEnviandoImagem(true);
  const previewAnterior = previewImagem;

  try {
    const arquivo = await comprimirImagem(arquivoOriginal);
    setPreviewImagem(URL.createObjectURL(arquivo));

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const { url } = await uploadImagemLojaAction(formData);
    setPreviewImagem(url);
    toast.success("Foto da loja atualizada!");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    setPreviewImagem(previewAnterior);
  } finally {
    setEnviandoImagem(false);
    if (inputImagemRef.current) inputImagemRef.current.value = "";
  }
}

  function handleWheelTabs(e: React.WheelEvent<HTMLDivElement>) {
    const el = tabsRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  }

  function handleMouseDownTabs(e: React.MouseEvent<HTMLDivElement>) {
    const el = tabsRef.current;
    if (!el) return;
    arrastando.current = true;
    inicioX.current = e.pageX;
    scrollInicial.current = el.scrollLeft;
  }

  function handleMouseMoveTabs(e: React.MouseEvent<HTMLDivElement>) {
    const el = tabsRef.current;
    if (!el || !arrastando.current) return;
    e.preventDefault();
    el.scrollLeft = scrollInicial.current - (e.pageX - inicioX.current);
  }

  function pararArrasto() {
    arrastando.current = false;
  }

  const [copiado, setCopiado] = useState(false);

  function copiarLink() {
    const url = `${window.location.origin}/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function campoForm<K extends keyof typeof form>(chave: K, valor: (typeof form)[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  function atualizarHorarioDia(dia: number, campoChave: keyof Horario, valor: any) {
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
      toast.success("Informações gerais salvas com sucesso!");
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

      const resFuso = await salvarConfiguracoesAction({
        fuso_horario: form.fuso_horario,
      });
      if (!resFuso.sucesso) {
        toast.error(resFuso.erro);
        return;
      }

      toast.success("Horários e fuso atualizados com sucesso!");
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
      toast.success("Credenciais e maquininha salvas com sucesso!");
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
      toast.success("Regras de agendamento atualizadas!");
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
      toast.success("Personalização salva com sucesso!");
    });
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Sua página pública</p>
          <p className="text-sm font-mono text-zinc-300 truncate mt-0.5">
            trimodetail.com.br/{form.slug}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copiarLink}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
          >
            {copiado ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Copiar link
              </>
            )}
          </button>
          <a
            href={`/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-colors"
            style={{ backgroundColor: form.cor_primaria || "#E56B25" }}
          >
            Ver loja
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>

      <div
        ref={tabsRef}
        onWheel={handleWheelTabs}
        onMouseDown={handleMouseDownTabs}
        onMouseMove={handleMouseMoveTabs}
        onMouseUp={pararArrasto}
        onMouseLeave={pararArrasto}
        className="flex border-b border-zinc-800 gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 cursor-grab active:cursor-grabbing select-none"
      >
        <button type="button" onClick={() => setAbaAtiva("geral")} className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${abaAtiva === "geral" ? "border-[#E56B25] text-white" : "border-transparent text-zinc-300 hover:text-white"}`}>Informações Gerais</button>
        <button type="button" onClick={() => setAbaAtiva("horarios")} className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${abaAtiva === "horarios" ? "border-[#E56B25] text-white" : "border-transparent text-zinc-300 hover:text-white"}`}>Horário de Funcionamento</button>
        <button type="button" onClick={() => setAbaAtiva("pagamentos")} className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${abaAtiva === "pagamentos" ? "border-[#E56B25] text-white" : "border-transparent text-zinc-300 hover:text-white"}`}>Pagamentos (Mercado Pago)</button>
        <button type="button" onClick={() => setAbaAtiva("regras")} className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${abaAtiva === "regras" ? "border-[#E56B25] text-white" : "border-transparent text-zinc-300 hover:text-white"}`}>Regras de Agendamento</button>
        <button type="button" onClick={() => setAbaAtiva("personalizacao")} className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${abaAtiva === "personalizacao" ? "border-[#E56B25] text-white" : "border-transparent text-zinc-300 hover:text-white"}`}>Personalização da Página</button>
      </div>

      {abaAtiva === "geral" && (
        <form onSubmit={handleSalvarGeral} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider pb-3 border-b border-zinc-800">Perfil da Estética</h2>
          <div>
            <label className={campo.label}>Nome da Loja</label>
            <input value={form.nome} onChange={(e) => campoForm("nome", e.target.value)} className={campo.input} required />
          </div>
          <div>
            <label className={campo.label}>Link Público (Slug)</label>
            <div className="flex items-center mt-1.5 rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden focus-within:border-[#E56B25]">
              <span className="pl-3 text-xs text-zinc-300 font-mono select-none hidden sm:inline">trimodetail.com.br/</span>
              <span className="pl-3 text-xs text-zinc-300 font-mono select-none sm:hidden">.../</span>
              <input value={form.slug} onChange={(e) => campoForm("slug", e.target.value)} className="w-full h-10 px-1 bg-transparent text-white text-sm outline-none font-mono min-w-0" required />
            </div>
          </div>
          <div>
            <label className={campo.label}>Endereço Completo</label>
            <input value={form.endereco ?? ""} onChange={(e) => campoForm("endereco", e.target.value)} className={campo.input} />
          </div>
          <div>
            <label className={campo.label}>Descrição da Estética</label>
            <textarea value={form.descricao ?? ""} onChange={(e) => campoForm("descricao", e.target.value)} className={campo.textarea} rows={3} placeholder="Fale um pouco sobre a especialidade..." />
          </div>
          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button type="submit" disabled={pending} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50">
              {pending ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      )}

      {abaAtiva === "horarios" && (
        <form onSubmit={handleSalvarHorarios} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider pb-3 border-b border-zinc-800">Expediente da Estética</h2>
          <p className="text-xs text-zinc-300">Defina os dias e horários em que a sua estética abre para atendimento online.</p>
          <div className="space-y-3 pt-2">
            {DIAS_SEMANA.map((diaInfo) => {
              const h = horarios.find((item) => item.dia_semana === diaInfo.id) || { dia_semana: diaInfo.id, hora_abertura: "08:00", hora_fechamento: "18:00", fechado: true };
              return (
                <div key={diaInfo.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 sm:min-w-[180px] shrink-0">
                    <input type="checkbox" id={`dia_${diaInfo.id}`} checked={!h.fechado} onChange={(e) => atualizarHorarioDia(diaInfo.id, "fechado", !e.target.checked)} className="w-5 h-5 shrink-0 bg-zinc-900 border-zinc-600 rounded focus:ring-[#E56B25] accent-[#E56B25] cursor-pointer" />
                    <label htmlFor={`dia_${diaInfo.id}`} className="text-sm font-bold text-white cursor-pointer select-none">{diaInfo.nome}</label>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-1 sm:justify-end">
                    {h.fechado ? (
                      <span className="inline-block w-fit text-xs font-bold text-red-400 uppercase tracking-wider bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded-lg">Fechado neste dia</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Das</span>
                          <input type="time" value={h.hora_abertura ? h.hora_abertura.substring(0, 5) : "08:00"} onChange={(e) => atualizarHorarioDia(diaInfo.id, "hora_abertura", e.target.value)} className="h-9 px-2 rounded-lg border border-zinc-600 bg-zinc-900 text-white text-sm font-mono outline-none focus:border-[#E56B25] [color-scheme:dark]" />
                        </div>
                        <span className="text-zinc-500 font-bold text-sm">até</span>
                        <div className="flex items-center gap-1.5">
                          <input type="time" value={h.hora_fechamento ? h.hora_fechamento.substring(0, 5) : "18:00"} onChange={(e) => atualizarHorarioDia(diaInfo.id, "hora_fechamento", e.target.value)} className="h-9 px-2 rounded-lg border border-zinc-600 bg-zinc-900 text-white text-sm font-mono outline-none focus:border-[#E56B25] [color-scheme:dark]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className={campo.label}>Fuso Horário da Estética</label>
            <select value={form.fuso_horario ?? "America/Sao_Paulo"} onChange={(e) => campoForm("fuso_horario", e.target.value)} className={`${campo.input} appearance-none`}>
              <option value="America/Noronha">UTC-2 (Fernando de Noronha)</option>
              <option value="America/Sao_Paulo">UTC-3 (Horário de Brasília - Sul, Sudeste, NE)</option>
              <option value="America/Manaus">UTC-4 (Horário do Amazonas, MT, MS)</option>
              <option value="America/Rio_Branco">UTC-5 (Horário do Acre)</option>
            </select>
            <p className="text-[11px] text-zinc-400 mt-1.5">Todos os agendamentos seguirão o horário da cidade onde a estética está localizada.</p>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button type="submit" disabled={pending} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50">
              {pending ? "Salvando..." : "Salvar Horários"}
            </button>
          </div>
        </form>
      )}

      {abaAtiva === "pagamentos" && (
        <form onSubmit={handleSalvarPagamentos} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">Recebimento via Pix Automático</h2>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">Conecte sua conta do Mercado Pago para gerar QR Codes Pix instantâneos.</p>
            </div>
            <div>
              <label className={campo.label}>Access Token (Credencial de Produção)</label>
              <input type="password" value={form.mercadopago_access_token} onChange={(e) => campoForm("mercadopago_access_token", e.target.value)} className={campo.input} placeholder={form.tem_mercadopago_configurado ? "•••••••••••• (Configurado)" : "APP_USR-xxxxxx..."} />
              {form.tem_mercadopago_configurado && <p className="text-xs text-emerald-400 mt-2 font-semibold">✓ Token ativo e configurado com sucesso.</p>}
            </div>
            <div>
              <label className={campo.label}>User ID do Mercado Pago</label>
              <input value={form.mercadopago_user_id ?? ""} onChange={(e) => campoForm("mercadopago_user_id", e.target.value)} className={campo.input} placeholder="Ex: 123456789" />
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">Integração com Maquininha de Cartão (Point)</h2>
            </div>
            <div>
              <label className={campo.label}>Device ID / Serial da Maquininha <span className="text-zinc-400 font-normal">(Opcional)</span></label>
              <input value={form.mercadopago_device_id ?? ""} onChange={(e) => campoForm("mercadopago_device_id", e.target.value)} className={campo.input} placeholder="Ex: POINT_SMART_123456" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">Taxas das Maquininhas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={campo.label}>Taxa de Débito (%)</label>
                <input type="number" step="0.01" value={form.taxa_debito_percentual ?? 1.99} onChange={(e) => campoForm("taxa_debito_percentual", Number(e.target.value))} className={campo.input} />
              </div>
              <div>
                <label className={campo.label}>Taxa de Crédito à Vista (%)</label>
                <input type="number" step="0.01" value={form.taxa_credito_percentual ?? 4.98} onChange={(e) => campoForm("taxa_credito_percentual", Number(e.target.value))} className={campo.input} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button type="submit" disabled={pending} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-lg shadow-[#E56B25]/20">
              {pending ? "Salvando..." : "Salvar Configurações de Pagamento"}
            </button>
          </div>
        </form>
      )}

      {abaAtiva === "regras" && (
        <form onSubmit={handleSalvarRegras} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider pb-3 border-b border-zinc-800">Parâmetros da Agenda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={campo.label}>Antecedência Mínima (Minutos)</label>
              <input type="number" value={form.antecedencia_minima_minutos} onChange={(e) => campoForm("antecedencia_minima_minutos", Number(e.target.value))} className={campo.input} />
            </div>
            <div>
              <label className={campo.label}>Prazo Limite para Cancelamento (Minutos)</label>
              <input type="number" value={form.prazo_cancelamento_minutos} onChange={(e) => campoForm("prazo_cancelamento_minutos", Number(e.target.value))} className={campo.input} />
            </div>
            <div>
              <label className={campo.label}>Lembrete de Confirmação (Minutos Antes)</label>
              <input type="number" value={form.lembrete_confirmacao_minutos} onChange={(e) => campoForm("lembrete_confirmacao_minutos", Number(e.target.value))} className={campo.input} />
            </div>
            <div>
              <label className={campo.label}>Dias Futuros Visíveis para Agendamento</label>
              <input type="number" value={form.dias_futuros_visiveis} onChange={(e) => campoForm("dias_futuros_visiveis", Number(e.target.value))} className={campo.input} />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button type="submit" disabled={pending} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50">
              {pending ? "Salvando..." : "Salvar Regras"}
            </button>
          </div>
        </form>
      )}

      {abaAtiva === "personalizacao" && (
        <form onSubmit={handleSalvarPersonalizacao} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider pb-3 border-b border-zinc-800">
              Foto da Loja
            </h2>
            <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
              Essa imagem aparece no topo da sua página pública de agendamento. Use uma foto quadrada, de preferência.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800 shrink-0 flex items-center justify-center">
              {previewImagem ? (
                <img src={previewImagem} alt="Foto da loja" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-500">Sem foto</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
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
                className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors disabled:opacity-50"
              >
                {enviandoImagem ? "Enviando..." : "Trocar foto"}
              </button>
              <p className="text-[11px] text-zinc-500">JPG, PNG ou WEBP · até 5MB</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider pb-3 border-b border-zinc-800">Cor da Página do Cliente</h2>
            <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
              Essa é a cor usada nos botões e destaques da sua página pública de agendamento
              (<span className="font-mono text-zinc-400">trimodetail.com.br/{form.slug}</span>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.cor_primaria || "#E56B25"}
                onChange={(e) => campoForm("cor_primaria", e.target.value)}
                className="w-12 h-12 rounded-lg border border-zinc-700 bg-zinc-900 cursor-pointer p-0"
              />
              <input
                type="text"
                value={form.cor_primaria || "#E56B25"}
                onChange={(e) => campoForm("cor_primaria", e.target.value)}
                className="h-10 w-28 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-sm font-mono outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25]"
                placeholder="#E56B25"
                maxLength={7}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {CORES_SUGERIDAS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => campoForm("cor_primaria", cor)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.cor_primaria === cor ? "border-white" : "border-transparent"}`}
                  style={{ backgroundColor: cor }}
                  title={cor}
                />
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Prévia</p>
            <div className="bg-white rounded-lg p-4 flex flex-col gap-3 max-w-xs">
              <div className="border border-gray-200 rounded-xl p-3">
                <p className="text-sm font-medium text-zinc-900">Lavagem Completa</p>
                <p className="text-xs text-gray-500">R$ 80,00 · 40 min</p>
              </div>
              <button
                type="button"
                className="w-full py-2 rounded-lg text-white text-sm font-bold"
                style={{ backgroundColor: form.cor_primaria || "#E56B25" }}
              >
                Confirmar agendamento
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button type="submit" disabled={pending} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50">
              {pending ? "Salvando..." : "Salvar Personalização"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}