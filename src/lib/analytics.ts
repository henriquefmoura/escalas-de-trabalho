import { Cupom } from "./types";

export type ComplexidadeCompra =
  | "rapida"
  | "media"
  | "complexa"
  | "critica";

export function classificarCompra(
  quantidadeItens: number,
  duracao: number
): ComplexidadeCompra {
  if (duracao > 10) return "critica";
  if (quantidadeItens >= 7 || duracao > 5) return "complexa";
  if (quantidadeItens >= 3 || duracao > 2) return "media";
  return "rapida";
}

export function calcularPercentil(valores: number[], percentil: number): number {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const index = Math.ceil((percentil / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function calcularTempoMedio(cupons: Cupom[]): number {
  if (cupons.length === 0) return 0;
  return cupons.reduce((sum, c) => sum + c.duracao, 0) / cupons.length;
}

export function calcularTempoMedioPorTamanho(cupons: Cupom[]) {
  const grupos: Record<string, number[]> = {
    rapida: [],
    media: [],
    complexa: [],
    critica: [],
  };

  for (const cupom of cupons) {
    const tipo = classificarCompra(cupom.quantidadeItens, cupom.duracao);
    grupos[tipo].push(cupom.duracao);
  }

  return {
    rapida: calcularTempoMedio(cupons.filter((c) => classificarCompra(c.quantidadeItens, c.duracao) === "rapida")),
    media: calcularTempoMedio(cupons.filter((c) => classificarCompra(c.quantidadeItens, c.duracao) === "media")),
    complexa: calcularTempoMedio(cupons.filter((c) => classificarCompra(c.quantidadeItens, c.duracao) === "complexa")),
    critica: calcularTempoMedio(cupons.filter((c) => classificarCompra(c.quantidadeItens, c.duracao) === "critica")),
  };
}

export function calcularEstatisticasPorOperador(
  cupons: Cupom[],
  produtividadeMediaGeral: number
) {
  const porLdap: Record<string, Cupom[]> = {};
  for (const cupom of cupons) {
    if (!porLdap[cupom.ldap]) porLdap[cupom.ldap] = [];
    porLdap[cupom.ldap].push(cupom);
  }

  return Object.entries(porLdap).map(([ldap, cs]) => {
    const tempos = cs.map((c) => c.duracao);
    const tempoMedio = calcularTempoMedio(cs);
    const totalItens = cs.reduce((s, c) => s + c.quantidadeItens, 0);
    const totalMinutos = cs.reduce((s, c) => s + c.duracao, 0);
    const longos = cs.filter((c) => c.duracao > 5).length;
    const comPedido = cs.filter((c) => c.temPedido).length;
    const identificados = cs.filter((c) => c.clienteIdentificado).length;

    return {
      ldap,
      transacoes: cs.length,
      tempoMedio,
      percentil90: calcularPercentil(tempos, 90),
      linhasPorMinuto: totalMinutos > 0 ? totalItens / totalMinutos : 0,
      participacaoAtendimentosLongos: cs.length > 0 ? (longos / cs.length) * 100 : 0,
      taxaIdentificacaoCliente: cs.length > 0 ? (identificados / cs.length) * 100 : 0,
      cuponsComPedido: comPedido,
      acimaDaMedia: tempoMedio < produtividadeMediaGeral,
    };
  });
}

export function calcularCurvaDedemanda(cupons: Cupom[], produtividadeMedia: number) {
  const porHora: Record<string, number> = {};

  for (const cupom of cupons) {
    const hora = new Date(cupom.dataHoraInicio);
    const key = `${hora.getFullYear()}-${String(hora.getMonth() + 1).padStart(2, "0")}-${String(hora.getDate()).padStart(2, "0")} ${String(hora.getHours()).padStart(2, "0")}:00`;
    porHora[key] = (porHora[key] || 0) + 1;
  }

  return Object.entries(porHora)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, clientes]) => {
      // produtividadeMedia = clientes por hora por caixa
      const caixasNecessarios =
        produtividadeMedia > 0
          ? Math.ceil(clientes / produtividadeMedia)
          : 1;
      // assume caixas disponíveis como os ativos naquele horário (simplificado: usa operadores únicos)
      const cuponsHora = cupons.filter((c) => {
        const h = new Date(c.dataHoraInicio);
        const key2 = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")} ${String(h.getHours()).padStart(2, "0")}:00`;
        return key2 === hora;
      });
      const caixasDisponiveis = new Set(cuponsHora.map((c) => c.ldap)).size;

      return { hora, clientes, caixasDisponiveis, caixasNecessarios };
    });
}

export function calcularEstatisticasDemanda(cupons: Cupom[]) {
  const transacoesPorDia: Record<string, number> = {};
  const transacoesPorHora: Record<number, number> = {};
  const transacoesPorDiaSemana: Record<string, number> = {};

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  for (const cupom of cupons) {
    const dt = new Date(cupom.dataHoraInicio);
    const dia = dt.toISOString().slice(0, 10);
    const hora = dt.getHours();
    const diaSemana = diasSemana[dt.getDay()];

    transacoesPorDia[dia] = (transacoesPorDia[dia] || 0) + 1;
    transacoesPorHora[hora] = (transacoesPorHora[hora] || 0) + 1;
    transacoesPorDiaSemana[diaSemana] =
      (transacoesPorDiaSemana[diaSemana] || 0) + 1;
  }

  const totalTransacoes = cupons.length;
  const participacaoPorHorario: Record<number, number> = {};
  for (const [hora, qtd] of Object.entries(transacoesPorHora)) {
    participacaoPorHorario[Number(hora)] =
      totalTransacoes > 0 ? (qtd / totalTransacoes) * 100 : 0;
  }

  const picoDiario = Object.entries(transacoesPorDia).reduce(
    (max, [dia, qtd]) => (qtd > max.quantidade ? { dia, quantidade: qtd } : max),
    { dia: "", quantidade: 0 }
  );

  const picoHorario = Object.entries(transacoesPorHora).reduce(
    (max, [hora, qtd]) =>
      qtd > max.quantidade ? { hora: Number(hora), quantidade: qtd } : max,
    { hora: 0, quantidade: 0 }
  );

  return {
    transacoesPorDia,
    transacoesPorHora,
    transacoesPorDiaSemana,
    participacaoPorHorario,
    picoDiario,
    picoHorario,
  };
}

export function calcularProdutosImpactantes(cupons: Cupom[]) {
  const tempoMedioGeral = calcularTempoMedio(cupons);
  const produtoStats: Record<string, { freq: number; totalTempo: number }> = {};

  for (const cupom of cupons) {
    for (const produto of cupom.produtos) {
      if (!produtoStats[produto])
        produtoStats[produto] = { freq: 0, totalTempo: 0 };
      produtoStats[produto].freq += 1;
      produtoStats[produto].totalTempo += cupom.duracao;
    }
  }

  return Object.entries(produtoStats)
    .map(([produto, stats]) => ({
      produto,
      frequencia: stats.freq,
      tempoMedioComItem: stats.totalTempo / stats.freq,
      impactoTempo: stats.totalTempo / stats.freq - tempoMedioGeral,
    }))
    .sort((a, b) => b.impactoTempo - a.impactoTempo)
    .slice(0, 20);
}

export function calcularProdutosDemorados(cupons: Cupom[]) {
  const limiarDemorado = calcularPercentil(cupons.map((c) => c.duracao), 90);
  const demorados = cupons.filter((c) => c.duracao >= limiarDemorado);

  const freq: Record<string, number> = {};
  for (const cupom of demorados) {
    for (const produto of cupom.produtos) {
      freq[produto] = (freq[produto] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .map(([produto, frequenciaEmDemorados]) => ({ produto, frequenciaEmDemorados }))
    .sort((a, b) => b.frequenciaEmDemorados - a.frequenciaEmDemorados)
    .slice(0, 20);
}

export function processarCupons(cupons: Cupom[]) {
  const convencional = cupons.filter((c) => !c.isSelfCheckout);
  const selfCheckout = cupons.filter((c) => c.isSelfCheckout);

  const tempoMedioAtendimento = calcularTempoMedio(cupons);
  const tempoMedioPorTamanho = calcularTempoMedioPorTamanho(cupons);

  // Produtividade: transacoes por hora por operador convencional
  const operadoresUnicos = new Set(convencional.map((c) => c.ldap)).size;
  const totalHoras = convencional.reduce((s, c) => s + c.duracao, 0) / 60;
  const produtividadeMediaEquipe =
    totalHoras > 0 ? convencional.length / totalHoras : 0;

  const estatisticasPorLdap = calcularEstatisticasPorOperador(
    convencional,
    tempoMedioAtendimento
  );

  const sorted = [...estatisticasPorLdap].sort((a, b) => a.tempoMedio - b.tempoMedio);
  const melhoresAtendentes = sorted.slice(0, 5);
  const pioresAtendentes = sorted.slice(-5).reverse();

  const aproveitamentoSelfCheckout = {
    totalTransacoes: selfCheckout.length,
    totalGeral: cupons.length,
    percentual: cupons.length > 0 ? (selfCheckout.length / cupons.length) * 100 : 0,
    tempoMedioSelf: calcularTempoMedio(selfCheckout),
    tempoMedioConvencional: calcularTempoMedio(convencional),
  };

  const itensMaisImpactantes = calcularProdutosImpactantes(cupons);
  const produtosAtendimentosDemorados = calcularProdutosDemorados(cupons);
  const curvaDedemanda = calcularCurvaDedemanda(cupons, produtividadeMediaEquipe);
  const estatisticasDemanda = calcularEstatisticasDemanda(cupons);

  return {
    tempoMedioAtendimento,
    tempoMedioPorTamanho,
    melhoresAtendentes,
    pioresAtendentes,
    aproveitamentoSelfCheckout,
    itensMaisImpactantes,
    produtosAtendimentosDemorados,
    produtividadeMediaEquipe,
    curvaDedemanda,
    estatisticasPorLdap,
    estatisticasDemanda,
  };
}
