import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Análise de Cupons de Caixa",
  description: "Dashboard de análise de desempenho do caixa de loja",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
