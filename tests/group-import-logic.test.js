"use strict";

const assert = require("assert");
const ImportLogic = require("../group-import-logic.js");
const XLSX = require("../vendor/xlsx-js-style.min.js");

(function readsEmbeddedJsonGroups() {
  const html = `
    <script id="groupsData" type="application/json">
      [["Ana", "Bruno"], ["Carla"]]
    </script>
  `;
  assert.deepStrictEqual(ImportLogic.parseHtml(html), [["Ana", "Bruno"], ["Carla"]]);
})();

(function readsVisibleGroupCards() {
  const html = `
    <article class="final-group-card"><h2>Grupo 1</h2><ol><li>Ana</li><li>Bruno</li></ol></article>
    <article class="final-group-card"><h2>Grupo 2</h2><ol><li>Carla</li></ol></article>
  `;
  assert.deepStrictEqual(ImportLogic.parseHtml(html), [["Ana", "Bruno"], ["Carla"]]);
})();

(function readsHeadingsFollowedByLists() {
  const html = `
    <h2>GRUPO 1</h2><ol><li>ANA CLARA</li><li>IGOR GOMES</li></ol>
    <hr><h2>GRUPO 2</h2><ol><li>CARLA LEAL</li></ol>
  `;
  assert.deepStrictEqual(ImportLogic.parseHtml(html), [["ANA CLARA", "IGOR GOMES"], ["CARLA LEAL"]]);
})();

(function decodesEntitiesAndRemovesNestedMarkup() {
  const html = `<h2>Grupo 1</h2><ul><li><strong>João</strong> &amp; Silva</li></ul>`;
  assert.deepStrictEqual(ImportLogic.parseHtml(html), [["João & Silva"]]);
})();

(function rejectsInvalidOrDuplicateStudents() {
  assert.throws(() => ImportLogic.parseHtml("<p>Sem grupos</p>"), /nenhum grupo/i);
  assert.throws(
    () => ImportLogic.parseHtml(`<script id="groupsData" type="application/json">[["Ana"],[" ana "]]</script>`),
    /duplicado/i
  );
})();

(function createsApplicationState() {
  const state = ImportLogic.createAppState([["Ana", "Bruno"], ["Carla"]], "turma.html");
  assert.strictEqual(state.groupCount, 2);
  assert.strictEqual(state.studentCount, 3);
  assert.deepStrictEqual(state.capacities, [2, 1]);
  assert.strictEqual(state.importedFrom, "turma.html");
})();

(function importsACompleteSanitizedHtmlFile() {
  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <body>
        <script id="groupsData" type="application/json">
          [["Ana Souza", "Bruno Lima"], ["Carla Dias"]]
        </script>
        <a id="startPresentationsButton" href="apresentacoes.html">Iniciar apresentações</a>
      </body>
    </html>
  `;
  const groups = ImportLogic.parseHtml(html);
  assert.deepStrictEqual(groups, [["Ana Souza", "Bruno Lima"], ["Carla Dias"]]);
  assert.match(html, /id=["']startPresentationsButton["']/);
})();

(function readsGroupAndStudentColumnsPreservingFirstSeenOrder() {
  const rows = [
    ["Grupo", "Aluno"],
    ["Equipe B", "Bruno"],
    ["Equipe A", "Ana"],
    ["Equipe B", "Bianca"],
    ["Equipe A", "Arthur"]
  ];
  assert.deepStrictEqual(ImportLogic.parseTableRows(rows), [
    ["Bruno", "Bianca"],
    ["Ana", "Arthur"]
  ]);
})();

(function recognizesHeadersIgnoringCaseWhitespaceAndAccents() {
  const rows = [
    ["  GRÚPO  ", "nome do ALUNO"],
    [1, "Ana"],
    [2, "Bruno"]
  ];
  assert.deepStrictEqual(ImportLogic.parseTableRows(rows), [["Ana"], ["Bruno"]]);
})();

(function readsDelimitedAndSectionedText() {
  const table = "Grupo;Aluno\n1;Ana\n1;Bruno\n2;Carla";
  assert.deepStrictEqual(ImportLogic.parseText(table), [["Ana", "Bruno"], ["Carla"]]);

  const sections = "GRUPO 1\nAna\nBruno\n\nGRUPO 2\nCarla";
  assert.deepStrictEqual(ImportLogic.parseText(sections), [["Ana", "Bruno"], ["Carla"]]);
})();

(function readsRealXlsxWorkbookFromFirstSheet() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Grupo", "Aluno"],
    [1, "Ana"],
    [1, "Bruno"],
    [2, "Carla"]
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Turma");
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  assert.deepStrictEqual(ImportLogic.parseWorkbook(XLSX, bytes), [["Ana", "Bruno"], ["Carla"]]);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  assert.deepStrictEqual(ImportLogic.parseWorkbook(XLSX, arrayBuffer), [["Ana", "Bruno"], ["Carla"]]);
})();

(function readsRealSemicolonSeparatedCsv() {
  const csv = Buffer.from("Grupo;Aluno\r\n1;Ana\r\n1;Bruno\r\n2;Carla", "utf8");
  assert.deepStrictEqual(ImportLogic.parseWorkbook(XLSX, csv), [["Ana", "Bruno"], ["Carla"]]);
})();

(function rejectsMissingHeadersAndIncompleteRows() {
  assert.throws(() => ImportLogic.parseTableRows([["Nome", "Equipe"], ["Ana", 1]]), /colunas.*grupo.*aluno/i);
  assert.throws(() => ImportLogic.parseTableRows([["Grupo", "Aluno"], [1, ""]]), /aluno.*linha 2/i);
  assert.throws(() => ImportLogic.parseTableRows([["Grupo", "Aluno"], ["", "Ana"]]), /grupo.*linha 2/i);
})();

console.log("✓ 14 conjuntos de testes de importação passaram.");
