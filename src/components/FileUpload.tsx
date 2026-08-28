"use client";

import { useState, useCallback } from "react";
import { AnalyticsResult } from "@/lib/types";

interface Props {
  onResult: (data: AnalyticsResult, total: number) => void;
}

export default function FileUpload({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Erro desconhecido");
        } else {
          onResult(json.analytics, json.cupons);
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [onResult]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
        dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <div>
          <p className="text-lg font-semibold text-gray-700">
            Arraste a planilha ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500 mt-1">Formatos: .xlsx, .xls, .csv</p>
        </div>
        <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          {loading ? "Processando..." : "Selecionar arquivo"}
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={loading} />
        </label>
      </div>
      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
    </div>
  );
}
