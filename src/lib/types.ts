export interface Cupom {
  numeroCupom: string;
  dataHoraInicio: Date;
  dataHoraFim: Date;
  duracao: number; // minutos
  ldap: string; // operador
  quantidadeItens: number;
  secoes: string[];
  isSelfCheckout: boolean;
  temPedido: boolean;
  clienteIdentificado: boolean;
  produtos: string[];
  totalVenda: number;
}

export interface AnalyticsResult {
  tempoMedioAtendimento: number;
  tempoMedioPorTamanho: {
    rapida: number;
    media: number;
    complexa: number;
    critica: number;
  };
  melhoresAtendentes: OperadorStats[];
  pioresAtendentes: OperadorStats[];
  aproveitamentoSelfCheckout: SelfCheckoutStats;
  itensMaisImpactantes: ItemImpacto[];
  produtosAtendimentosDemorados: ProdutoFrequencia[];
  produtividadeMediaEquipe: number;
  curvaDedemanda: DemandaHora[];
  estatisticasPorLdap: OperadorStats[];
  estatisticasDemanda: EstatisticasDemanda;
}

export interface OperadorStats {
  ldap: string;
  transacoes: number;
  tempoMedio: number;
  percentil90: number;
  linhasPorMinuto: number;
  participacaoAtendimentosLongos: number;
  taxaIdentificacaoCliente: number;
  cuponsComPedido: number;
  acimaDaMedia: boolean;
}

export interface SelfCheckoutStats {
  totalTransacoes: number;
  totalGeral: number;
  percentual: number;
  tempoMedioSelf: number;
  tempoMedioConvencional: number;
}

export interface ItemImpacto {
  produto: string;
  frequencia: number;
  tempoMedioComItem: number;
  impactoTempo: number;
}

export interface ProdutoFrequencia {
  produto: string;
  frequenciaEmDemorados: number;
}

export interface DemandaHora {
  hora: string;
  clientes: number;
  caixasDisponiveis: number;
  caixasNecessarios: number;
}

export interface EstatisticasDemanda {
  transacoesPorDia: Record<string, number>;
  transacoesPorHora: Record<number, number>;
  transacoesPorDiaSemana: Record<string, number>;
  participacaoPorHorario: Record<number, number>;
  picoDiario: { dia: string; quantidade: number };
  picoHorario: { hora: number; quantidade: number };
}
