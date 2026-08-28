"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AnalyticsResult } from "@/lib/types";

interface Props {
  data: AnalyticsResult;
  totalCupons: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Metric({ label, value, unit = "" }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-900">
        {typeof value === "number" ? value.toFixed(1) : value}
        {unit && <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export default function Dashboard({ data, totalCupons }: Props) {
  const {
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
  } = data;

  const tempoTamanhoData = [
    { name: "Rápida (1–2 itens)", tempo: tempoMedioPorTamanho.rapida },
    { name: "Média (3–6 itens)", tempo: tempoMedioPorTamanho.media },
    { name: "Complexa (7+ itens)", tempo: tempoMedioPorTamanho.complexa },
    { name: "Crítica (>10 min)", tempo: tempoMedioPorTamanho.critica },
  ];

  const selfData = [
    { name: "Self Checkout", value: aproveitamentoSelfCheckout.totalTransacoes },
    { name: "Convencional", value: totalCupons - aproveitamentoSelfCheckout.totalTransacoes },
  ];

  const demandaHoraData = Object.entries(estatisticasDemanda.transacoesPorHora)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([hora, qtd]) => ({ hora: `${hora}h`, clientes: qtd }));

  const demandaDiaData = Object.entries(estatisticasDemanda.transacoesPorDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, qtd]) => ({ dia, clientes: qtd }));

  const demandaDiaSemanaData = Object.entries(estatisticasDemanda.transacoesPorDiaSemana)
    .map(([dia, qtd]) => ({ dia, clientes: qtd }));

  const curvaSample = curvaDedemanda.slice(0, 72);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <Metric label="Total de Cupons" value={totalCupons} />
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <Metric label="Tempo Médio de Atendimento" value={tempoMedioAtendimento} unit="min" />
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <Metric label="Produtividade Média da Equipe" value={produtividadeMediaEquipe} unit="cupons/h" />
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <Metric label="Self Checkout" value={aproveitamentoSelfCheckout.percentual} unit="%" />
        </div>
      </div>

      {/* Tempo por tamanho do cupom */}
      <Card title="Tempo Médio por Complexidade de Compra">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={tempoTamanhoData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis unit=" min" />
            <Tooltip formatter={(v) => typeof v === "number" ? `${v.toFixed(1)} min` : String(v)} />
            <Bar dataKey="tempo" name="Tempo médio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Melhores e piores atendentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="🏆 Melhores Atendentes (menor tempo médio)">
          <div className="space-y-2">
            {melhoresAtendentes.map((op, i) => (
              <div key={op.ldap} className="flex justify-between items-center py-1 border-b last:border-0">
                <span className="font-medium text-gray-700">
                  #{i + 1} {op.ldap}
                </span>
                <div className="text-right text-sm text-gray-500">
                  <span className="font-semibold text-green-600">{op.tempoMedio.toFixed(1)} min</span>
                  {" · "}{op.transacoes} cupons{" · "}{op.linhasPorMinuto.toFixed(2)} itens/min
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="⚠️ Atenção: Menor Produtividade">
          <div className="space-y-2">
            {pioresAtendentes.map((op, i) => (
              <div key={op.ldap} className="flex justify-between items-center py-1 border-b last:border-0">
                <span className="font-medium text-gray-700">
                  #{i + 1} {op.ldap}
                </span>
                <div className="text-right text-sm text-gray-500">
                  <span className="font-semibold text-red-500">{op.tempoMedio.toFixed(1)} min</span>
                  {" · "}{op.transacoes} cupons{" · "}{op.linhasPorMinuto.toFixed(2)} itens/min
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Self Checkout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Aproveitamento do Self Checkout">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={selfData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {selfData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Transações self:</span> <strong>{aproveitamentoSelfCheckout.totalTransacoes}</strong></div>
              <div><span className="text-gray-500">Tempo médio self:</span> <strong>{aproveitamentoSelfCheckout.tempoMedioSelf.toFixed(1)} min</strong></div>
              <div><span className="text-gray-500">Tempo médio convencional:</span> <strong>{aproveitamentoSelfCheckout.tempoMedioConvencional.toFixed(1)} min</strong></div>
            </div>
          </div>
        </Card>

        {/* Estatísticas por operador */}
        <Card title="Métricas por Operador (LDAP)">
          <div className="overflow-auto max-h-60">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left py-1">Operador</th>
                  <th className="text-right py-1">Cupons</th>
                  <th className="text-right py-1">T.Médio</th>
                  <th className="text-right py-1">P90</th>
                  <th className="text-right py-1">Itens/min</th>
                  <th className="text-right py-1">% Longos</th>
                </tr>
              </thead>
              <tbody>
                {estatisticasPorLdap.map((op) => (
                  <tr key={op.ldap} className={`border-b ${op.acimaDaMedia ? "bg-green-50" : ""}`}>
                    <td className="py-1 font-medium">{op.ldap}</td>
                    <td className="text-right">{op.transacoes}</td>
                    <td className="text-right">{op.tempoMedio.toFixed(1)}m</td>
                    <td className="text-right">{op.percentil90.toFixed(1)}m</td>
                    <td className="text-right">{op.linhasPorMinuto.toFixed(2)}</td>
                    <td className="text-right">{op.participacaoAtendimentosLongos.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Itens impactantes */}
      {itensMaisImpactantes.length > 0 && (
        <Card title="Itens que Mais Impactam no Tempo de Atendimento">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={itensMaisImpactantes.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" unit=" min" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="produto" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => typeof v === "number" ? `${v.toFixed(1)} min` : String(v)} />
              <Bar dataKey="impactoTempo" name="Impacto no tempo" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Produtos demorados */}
      {produtosAtendimentosDemorados.length > 0 && (
        <Card title="Produtos Presentes nos Atendimentos Mais Demorados (P90)">
          <div className="flex flex-wrap gap-2">
            {produtosAtendimentosDemorados.slice(0, 15).map((p) => (
              <span key={p.produto} className="bg-red-100 text-red-700 text-xs rounded-full px-3 py-1">
                {p.produto} ({p.frequenciaEmDemorados}x)
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Curva de Demanda */}
      {curvaSample.length > 0 && (
        <Card title="Curva de Demanda — Clientes vs Caixas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={curvaSample}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" tick={{ fontSize: 10 }} interval={Math.ceil(curvaSample.length / 24)} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="clientes" name="Clientes" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="caixasDisponiveis" name="Caixas disponíveis" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="caixasNecessarios" name="Caixas necessários" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Demanda por hora */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Transações por Hora do Dia">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={demandaHoraData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clientes" name="Transações" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Transações por Dia da Semana">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={demandaDiaSemanaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clientes" name="Transações" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Transações por dia */}
      <Card title="Transações por Dia (evolução mensal)">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={demandaDiaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={Math.ceil(demandaDiaData.length / 15)} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="clientes" name="Transações" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Pico diário:</span>{" "}
            <strong>{estatisticasDemanda.picoDiario.dia}</strong>{" "}
            ({estatisticasDemanda.picoDiario.quantidade} transações)
          </div>
          <div>
            <span className="text-gray-500">Pico horário:</span>{" "}
            <strong>{estatisticasDemanda.picoHorario.hora}h</strong>{" "}
            ({estatisticasDemanda.picoHorario.quantidade} transações)
          </div>
        </div>
      </Card>
    </div>
  );
}
