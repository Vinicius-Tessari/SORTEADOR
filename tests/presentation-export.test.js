"use strict";

const assert = require("assert");
const XLSX = require("../vendor/xlsx-js-style.min.js");
const Exporter = require("../presentation-export.js");

(function workbookContainsTypedGradeData() {
  const rows = [
    {
      Aluno: "Ana", Grupo: 1, Nota: 7.25, "Situação": "Presente",
      "Observação individual": "Explicou os conceitos com clareza.",
      "Observação do grupo": "Boa organização."
    },
    {
      Aluno: "Bia", Grupo: 1, Nota: 0, "Situação": "Ausente",
      "Observação individual": "Não compareceu.",
      "Observação do grupo": "Boa organização."
    }
  ];
  const workbook = Exporter.createWorkbook(XLSX, rows, 7.5);
  assert.strictEqual(workbook.Sheets.Notas.E5.s.alignment.wrapText, true);
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx", cellStyles: true });
  const reopened = XLSX.read(bytes, { type: "buffer", cellStyles: true });
  const sheet = reopened.Sheets.Notas;

  assert.deepStrictEqual(reopened.SheetNames, ["Notas"]);
  assert.strictEqual(sheet.A1.v, "Notas das apresentações");
  assert.match(sheet.A2.v, /7,5/);
  assert.strictEqual(sheet.A4.v, "Aluno");
  assert.strictEqual(sheet.A4.s.fgColor.rgb, "276B5A");
  assert.strictEqual(sheet.A5.v, "Ana");
  assert.strictEqual(sheet.B5.v, 1);
  assert.strictEqual(sheet.C5.v, 7.25);
  assert.strictEqual(sheet.C5.t, "n");
  assert.strictEqual(sheet.D6.v, "Ausente");
  assert.strictEqual(sheet.E4.v, "Observação individual");
  assert.strictEqual(sheet.F4.v, "Observação do grupo");
  assert.strictEqual(sheet.E5.v, "Explicou os conceitos com clareza.");
  assert.strictEqual(sheet.F5.v, "Boa organização.");
  assert.deepStrictEqual(sheet["!autofilter"].ref, "A4:F6");
})();

console.log("✓ exportação XLSX validada com reabertura do arquivo.");
