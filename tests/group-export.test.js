"use strict";

const assert = require("assert");
const XLSX = require("../vendor/xlsx-js-style.min.js");
const Exporter = require("../group-export.js");
const Importer = require("../group-import-logic.js");

(function exportsOneStudentPerRowWithGroupAndStudentColumns() {
  const groups = [["Ana", "Bruno"], ["Carla"]];
  const rows = Exporter.buildRows(groups);
  assert.deepStrictEqual(rows, [
    { Grupo: 1, Aluno: "Ana" },
    { Grupo: 1, Aluno: "Bruno" },
    { Grupo: 2, Aluno: "Carla" }
  ]);

  const workbook = Exporter.createWorkbook(XLSX, groups);
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx", cellStyles: true });
  const reopened = XLSX.read(bytes, { type: "buffer", cellStyles: true });
  assert.deepStrictEqual(reopened.SheetNames, ["Grupos"]);
  assert.strictEqual(reopened.Sheets.Grupos.A1.v, "Grupos sorteados");
  assert.strictEqual(reopened.Sheets.Grupos.A4.v, "Grupo");
  assert.strictEqual(reopened.Sheets.Grupos.A4.s.fgColor.rgb, "276B5A");
  assert.deepStrictEqual(
    XLSX.utils.sheet_to_json(reopened.Sheets.Grupos, { range: 3 }),
    rows
  );
  assert.deepStrictEqual(Importer.parseWorkbook(XLSX, bytes), groups);
})();

(function rejectsMissingOrEmptyGroups() {
  assert.throws(() => Exporter.buildRows([]), /grupos/i);
  assert.throws(() => Exporter.buildRows([["Ana"], []]), /completos/i);
})();

console.log("✓ exportação dos grupos XLSX validada com reabertura do arquivo.");
