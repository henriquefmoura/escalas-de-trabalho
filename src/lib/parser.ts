import * as XLSX from "xlsx";
import { Cupom } from "./types";

function parseExcelDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return new Date();
}

function parseDuration(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // HH:MM:SS or MM:SS
    const parts = value.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
    if (parts.length === 2) return parts[0] + parts[1] / 60;
    return parseFloat(value) || 0;
  }
  return 0;
}

function parseList(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string")
    return value
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

export function parsearPlanilha(buffer: ArrayBuffer): Cupom[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows.map((row, idx) => {
    const inicio = parseExcelDate(
      row["DT_INICIO"] ??
        row["DATA_INICIO"] ??
        row["Início"] ??
        row["inicio"] ??
        row["DATA"] ??
        row["data"]
    );
    const fim = parseExcelDate(
      row["DT_FIM"] ??
        row["DATA_FIM"] ??
        row["Fim"] ??
        row["fim"] ??
        row["DATA_FIM"]
    );

    let duracao = parseDuration(
      row["DURACAO"] ??
        row["DURACAO_MIN"] ??
        row["Duração"] ??
        row["duracao"] ??
        row["TEMPO"] ??
        row["tempo"]
    );

    if (!duracao && fim > inicio) {
      duracao = (fim.getTime() - inicio.getTime()) / 60000;
    }

    const quantidadeItens = Number(
      row["QT_ITENS"] ??
        row["QUANTIDADE_ITENS"] ??
        row["Itens"] ??
        row["itens"] ??
        row["QTD_ITENS"] ??
        0
    );

    const ldap = String(
      row["LDAP"] ??
        row["OPERADOR"] ??
        row["operador"] ??
        row["ldap"] ??
        row["ATENDENTE"] ??
        `OP_${idx}`
    );

    const secoesRaw = String(
      row["SECOES"] ??
        row["SECAO"] ??
        row["secoes"] ??
        row["DEPARTAMENTO"] ??
        ""
    );
    const secoes = parseList(secoesRaw);

    const selfRaw = String(
      row["SELF_CHECKOUT"] ??
        row["self_checkout"] ??
        row["SELF"] ??
        row["TIPO"] ??
        ""
    ).toLowerCase();
    const isSelfCheckout =
      selfRaw === "s" ||
      selfRaw === "sim" ||
      selfRaw === "yes" ||
      selfRaw === "1" ||
      selfRaw === "true" ||
      selfRaw.includes("self");

    const pedidoRaw = String(
      row["PEDIDO"] ?? row["pedido"] ?? row["TEM_PEDIDO"] ?? ""
    ).toLowerCase();
    const temPedido =
      pedidoRaw === "s" ||
      pedidoRaw === "sim" ||
      pedidoRaw === "yes" ||
      pedidoRaw === "1" ||
      pedidoRaw === "true";

    const clienteRaw = String(
      row["CLIENTE_ID"] ??
        row["IDENTIFICADO"] ??
        row["cliente_identificado"] ??
        row["ID_CLIENTE"] ??
        ""
    ).toLowerCase();
    const clienteIdentificado =
      clienteRaw !== "" &&
      clienteRaw !== "0" &&
      clienteRaw !== "false" &&
      clienteRaw !== "nao" &&
      clienteRaw !== "não" &&
      clienteRaw !== "n";

    const produtos = parseList(
      String(
        row["PRODUTOS"] ??
          row["produtos"] ??
          row["DESCRICAO"] ??
          row["ITENS_DESC"] ??
          ""
      )
    );

    const totalVenda = Number(
      row["TOTAL"] ??
        row["VALOR_TOTAL"] ??
        row["total"] ??
        row["VL_TOTAL"] ??
        0
    );

    return {
      numeroCupom: String(
        row["NUM_CUPOM"] ??
          row["CUPOM"] ??
          row["cupom"] ??
          row["NR_CUPOM"] ??
          idx + 1
      ),
      dataHoraInicio: inicio,
      dataHoraFim: fim,
      duracao,
      ldap,
      quantidadeItens,
      secoes,
      isSelfCheckout,
      temPedido,
      clienteIdentificado,
      produtos,
      totalVenda,
    };
  });
}
