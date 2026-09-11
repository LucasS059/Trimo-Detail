import { notFound } from "next/navigation";
import { buscarAgendamento } from "@/lib/db/agendamentos";
import { obterHistoricoCliente, listarVeiculosDoCliente } from "@/lib/db/clientes";
import { PortalCliente, PortalAgendamento, PortalVeiculo } from "@/components/public/portal/portal-cliente";

export default async function AcompanharAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agendamento = await buscarAgendamento(id);
  if (!agendamento) notFound();

  const [historicoRes, veiculosRes] = await Promise.all([
    obterHistoricoCliente(agendamento.loja_id, agendamento.cliente_id),
    listarVeiculosDoCliente(agendamento.cliente_id)
  ]);

  const servicos = Array.isArray(agendamento.servicos) ? agendamento.servicos : [];
  const servicoPrincipal = servicos[0];

  const agendamentoAtual: PortalAgendamento = {
    id: agendamento.id,
    data_hora: agendamento.data_hora,
    status: agendamento.status,
    servico_nome: servicoPrincipal?.nome || "Serviço Automotivo",
    servico_preco: Number(agendamento.valor || servicoPrincipal?.preco || 0),
    duracao_minutos: Number(agendamento.duracao_minutos || servicoPrincipal?.duracaoMinutos || 60),
    observacoes: agendamento.observacoes,
    loja_id: agendamento.loja_id,
    loja_nome: agendamento.loja_nome,
    loja_slug: agendamento.loja_slug,
    loja_endereco: agendamento.loja_endereco,
    loja_tempo_cancelamento_horas: Math.max(1, Math.round((agendamento.prazo_cancelamento_minutos || 60) / 60)),
    veiculo_modelo: agendamento.veiculo_modelo || "Veículo não informado",
    veiculo_placa: agendamento.veiculo_placa || "SEM PLACA",
    veiculo_cor: agendamento.veiculo_cor || "N/A",
    cliente_id: agendamento.cliente_id,
    cliente_nome: agendamento.cliente_nome,
    cliente_telefone: agendamento.cliente_telefone,
    cliente_email: agendamento.cliente_email
  };

  const historicoFormatado: PortalAgendamento[] = (historicoRes.agendamentos || []).map((item: any) => {
    const itemServicos = Array.isArray(item.servicos) ? item.servicos : [];
    return {
      id: item.id,
      data_hora: item.data_hora,
      status: item.status,
      servico_nome: itemServicos[0]?.nome || "Serviço Automotivo",
      servico_preco: Number(item.valor || itemServicos[0]?.preco || 0),
      duracao_minutos: 60,
      observacoes: item.observacoes,
      loja_id: agendamento.loja_id,
      loja_nome: agendamento.loja_nome,
      loja_slug: agendamento.loja_slug,
      loja_endereco: agendamento.loja_endereco,
      loja_tempo_cancelamento_horas: Math.max(1, Math.round((agendamento.prazo_cancelamento_minutos || 60) / 60)),
      veiculo_modelo: item.veiculo_modelo || "Veículo",
      veiculo_placa: item.veiculo_placa || "",
      veiculo_cor: "",
      cliente_id: agendamento.cliente_id,
      cliente_nome: agendamento.cliente_nome,
      cliente_telefone: agendamento.cliente_telefone,
      cliente_email: agendamento.cliente_email
    };
  });

  const veiculosFormatados: PortalVeiculo[] = (veiculosRes || []).map((v: any) => ({
    id: v.id,
    modelo: v.modelo,
    marca: v.marca || null,
    placa: v.placa,
    cor: v.cor || null,
    categoria: v.categoria || null
  }));

  return (
    <PortalCliente
      agendamentoAtual={agendamentoAtual}
      historico={historicoFormatado}
      veiculos={veiculosFormatados}
    />
  );
}