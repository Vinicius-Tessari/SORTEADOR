"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const presentationHtml = fs.readFileSync(path.join(root, "apresentacoes.html"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "style.css"), "utf8");
const appScripts = ["script.js", "apresentacoes.js"]
  .map(file => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");

(function presentationPageHasEveryWorkflowPhase() {
  for (const id of ["configPanel", "readyPanel", "timerPanel", "gradingPanel", "completePanel"]) {
    assert.match(presentationHtml, new RegExp(`id=["']${id}["']`), `painel ausente: ${id}`);
  }
})();

(function presentationPageHasAnimatedDrawStage() {
  for (const id of ["drawAnimation", "rouletteGroupNumber", "rouletteStatus", "celebrationParticles"]) {
    assert.match(presentationHtml, new RegExp(`id=["']${id}["']`), `elemento da animação ausente: ${id}`);
  }
})();

(function presentationPageLoadsOfflineDependencies() {
  assert.match(presentationHtml, /vendor\/xlsx-js-style\.min\.js/);
  assert.match(presentationHtml, /presentation-logic\.js/);
  assert.match(presentationHtml, /presentation-export\.js/);
  assert.match(presentationHtml, /apresentacoes\.js/);
})();

(function completedDrawNavigatesToPresentations() {
  assert.match(indexHtml, /href=["']apresentacoes\.html["']/);
})();

(function completedDrawCanBeExportedToExcel() {
  assert.match(indexHtml, /id=["']exportGroupsButton["']/);
  assert.match(indexHtml, /group-export\.js/);
  assert.match(indexHtml, /vendor\/xlsx-js-style\.min\.js/);
})();

(function presentationPageLoadsTheTimerAlarm() {
  assert.match(presentationHtml, /presentation-alarm\.js/);
})();

(function everyNativeAlertWasReplacedByTheStyledDialog() {
  assert.doesNotMatch(appScripts, /(?:^|[^.\w])(?:alert|confirm)\s*\(/);
  for (const html of [indexHtml, presentationHtml]) assert.match(html, /ui-dialog\.js/);
})();

(function presentationConfigurationIncludesMaximumGrade() {
  assert.match(presentationHtml, /id=["']maximumGrade["']/);
})();

(function homePageOffersHtmlImport() {
  assert.match(indexHtml, /id=["']groupsHtmlFile["']/);
  assert.match(indexHtml, /id=["']importGroupsButton["']/);
  assert.match(indexHtml, /group-import-logic\.js/);
})();

(function importerDocumentsAndAcceptsEverySupportedFormat() {
  assert.match(indexHtml, /id=["']importFormatHelp["']/);
  for (const extension of [".html", ".xlsx", ".xls", ".csv", ".txt"]) {
    assert.match(indexHtml, new RegExp(extension.replace(".", "\\.")));
  }
  assert.match(indexHtml, /vendor\/xlsx-js-style\.min\.js/);
})();

(function homePageUsesTheCleanRedesign() {
  assert.doesNotMatch(indexHtml, /SORTEIO DE EQUIPES/i);
  assert.match(indexHtml, /<details[^>]+id=["']importFormatHelp["']/i);
  assert.match(indexHtml, /class=["'][^"']*setup-layout/i);
  assert.match(styles, /input\[type=["']?number["']?\]::-webkit-(?:inner|outer)-spin-button/i);
  assert.match(styles, /-moz-appearance:\s*textfield/i);
})();

console.log("✓ contrato da página de apresentações validado.");
