(function (global) {
  "use strict";

  const HEADERS = ["Aluno", "Grupo", "Nota", "Situação"];
  const Styler = global.SpreadsheetStyle || (typeof require !== "undefined" ? require("./spreadsheet-style.js") : null);

  function createWorkbook(xlsxApi, rows, maxGrade = 10) {
    if (!xlsxApi || !xlsxApi.utils) throw new Error("Biblioteca de planilhas indisponível.");
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Não há notas para exportar.");

    const formattedMaximum = Number(maxGrade).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    const worksheet = Styler.createStyledSheet(xlsxApi, {
      title: "Notas das apresentações",
      subtitle: `Nota máxima configurada: ${formattedMaximum}`,
      headers: HEADERS,
      dataRows: rows.map(row => [row.Aluno, row.Grupo, row.Nota, row["Situação"]]),
      columnWidths: [Math.max(24, ...rows.map(row => String(row.Aluno).length + 3)), 12, 12, 16],
      numericColumns: [2]
    });
    rows.forEach((row, index) => {
      if (row["Situação"] === "Ausente") Styler.styleAbsentRow(xlsxApi, worksheet, index + 5, HEADERS.length);
    });

    const workbook = xlsxApi.utils.book_new();
    xlsxApi.utils.book_append_sheet(workbook, worksheet, "Notas");
    workbook.Props = {
      Title: "Notas das apresentações",
      Subject: "Avaliação individual por grupo",
      Author: "Sorteador de Grupos"
    };
    return workbook;
  }

  function download(xlsxApi, rows, maxGrade = 10, filename = "notas-apresentacoes.xlsx") {
    const workbook = createWorkbook(xlsxApi, rows, maxGrade);
    xlsxApi.writeFile(workbook, filename, { compression: true, cellStyles: true });
  }

  const api = { createWorkbook, download };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.PresentationExport = api;
})(typeof window !== "undefined" ? window : globalThis);
