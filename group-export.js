(function (global) {
  "use strict";

  const HEADERS = ["Grupo", "Aluno"];
  const Styler = global.SpreadsheetStyle || (typeof require !== "undefined" ? require("./spreadsheet-style.js") : null);

  function buildRows(groups) {
    if (!Array.isArray(groups) || groups.length === 0) {
      throw new Error("Não há grupos para exportar.");
    }
    if (groups.some(group => !Array.isArray(group) || group.length === 0)) {
      throw new Error("Todos os grupos precisam estar completos para exportar.");
    }

    return groups.flatMap((students, groupIndex) =>
      students.map(student => ({
        Grupo: groupIndex + 1,
        Aluno: String(student).trim()
      }))
    );
  }

  function createWorkbook(xlsxApi, groups) {
    if (!xlsxApi || !xlsxApi.utils) throw new Error("Biblioteca de planilhas indisponível.");
    const rows = buildRows(groups);
    const worksheet = Styler.createStyledSheet(xlsxApi, {
      title: "Grupos sorteados",
      subtitle: `${rows.length} alunos distribuídos em ${groups.length} grupos`,
      headers: HEADERS,
      dataRows: rows.map(row => [row.Grupo, row.Aluno]),
      columnWidths: [14, Math.max(26, ...rows.map(row => row.Aluno.length + 3))]
    });

    const workbook = xlsxApi.utils.book_new();
    xlsxApi.utils.book_append_sheet(workbook, worksheet, "Grupos");
    workbook.Props = {
      Title: "Grupos sorteados",
      Subject: "Relação de alunos por grupo",
      Author: "Sorteador de Grupos"
    };
    return workbook;
  }

  function download(xlsxApi, groups, filename = "grupos-sorteados.xlsx") {
    xlsxApi.writeFile(createWorkbook(xlsxApi, groups), filename, { compression: true, cellStyles: true });
  }

  const api = { buildRows, createWorkbook, download };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.GroupExport = api;
})(typeof window !== "undefined" ? window : globalThis);
