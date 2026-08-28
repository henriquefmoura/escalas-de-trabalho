import { NextRequest, NextResponse } from "next/server";
import { parsearPlanilha } from "@/lib/parser";
import { processarCupons } from "@/lib/analytics";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const cupons = parsearPlanilha(buffer);

    if (cupons.length === 0) {
      return NextResponse.json({ error: "Nenhum cupom encontrado na planilha" }, { status: 400 });
    }

    const analytics = processarCupons(cupons);
    return NextResponse.json({ cupons: cupons.length, analytics });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao processar arquivo: " + String(err) },
      { status: 500 }
    );
  }
}
