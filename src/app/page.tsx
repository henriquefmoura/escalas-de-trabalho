"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";
import { AnalyticsResult } from "@/lib/types";

export default function Home() {
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [totalCupons, setTotalCupons] = useState(0);

  const handleResult = (data: AnalyticsResult, total: number) => {
    setAnalytics(data);
    setTotalCupons(total);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Análise de Cupons de Caixa
          </h1>
          <p className="text-gray-500 mt-1">
            Carregue a planilha do mês para visualizar os indicadores de desempenho do caixa.
          </p>
        </div>

        <FileUpload onResult={handleResult} />

        {analytics && (
          <div className="mt-8">
            <Dashboard data={analytics} totalCupons={totalCupons} />
          </div>
        )}
      </div>
    </main>
  );
}
