// components/financeiro/resumo-financeiro.tsx

const LABEL_FORMA: Record<string, string> = {
  pix: "Pix",
  point: "Cartão (maquininha)",
  manual: "Baixa manual",
};

export function ResumoFinanceiro({
  resumo,
}: {
  resumo: { porForma: { forma: string; total: string }[]; totalEmAberto: string };
}) {
  const totalRecebido = resumo.porForma.reduce((soma, item) => soma + Number(item.total), 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm text-gray-500 mb-1">Total recebido no mês</p>
        <p className="text-3xl font-semibold">
          R$ {totalRecebido.toFixed(2).replace(".", ",")}
        </p>
      </div>

      {resumo.porForma.map((item) => (
        <div key={item.forma} className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">{LABEL_FORMA[item.forma] ?? item.forma}</p>
          <p className="text-xl font-semibold">
            R$ {Number(item.total).toFixed(2).replace(".", ",")}
          </p>
        </div>
      ))}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm text-gray-500 mb-1">Em aberto (aguardando pagamento)</p>
        <p className="text-xl font-semibold text-orange-600">
          R$ {Number(resumo.totalEmAberto).toFixed(2).replace(".", ",")}
        </p>
      </div>
    </div>
  );
}
