"use strict";

const assert = require("assert");
const SessionFile = require("../session-file.js");
const PresentationLogic = require("../presentation-logic.js");

(function serializesAndRestoresTheCompleteApplicationState() {
  let presentation = PresentationLogic.createSession([["Ana"], ["Bia"]], 60, 7.5);
  presentation = PresentationLogic.drawNextGroup(presentation, () => 0);
  presentation = PresentationLogic.finishCurrentGroup(PresentationLogic.startCurrentGroup(presentation, 0));
  presentation = PresentationLogic.saveGrades(presentation, [
    { student: "Ana", grade: "7", absent: false, observation: "Bom trabalho" }
  ], "Apresentação clara");

  const appState = {
    groupCount: 2,
    studentCount: 2,
    capacities: [1, 1],
    groups: [["Ana"], ["Bia"]],
    createdAt: "2026-09-16T00:00:00.000Z",
    presentation
  };
  const restored = SessionFile.parse(SessionFile.serialize(appState, 1000));
  assert.deepStrictEqual(restored, appState);
})();

(function exportsARunningTimerAsPausedRemainingTime() {
  let presentation = PresentationLogic.createSession([["Ana"]], 120);
  presentation = PresentationLogic.startCurrentGroup(PresentationLogic.drawNextGroup(presentation, () => 0), 1000);
  const portable = SessionFile.createPortableState({
    groupCount: 1,
    studentCount: 1,
    capacities: [1],
    groups: [["Ana"]],
    presentation
  }, 31000);

  assert.strictEqual(portable.presentation.phase, "cronometro");
  assert.strictEqual(portable.presentation.timerPaused, true);
  assert.strictEqual(portable.presentation.pausedRemainingSeconds, 90);
  assert.strictEqual(portable.presentation.endAt, null);
})();

(function doesNotPersistATemporaryProjectorAnimation() {
  const portable = SessionFile.createPortableState({
    groupCount: 1,
    studentCount: 1,
    capacities: [1],
    groups: [["Ana"]],
    projectorDraw: { active: true, groupIndex: 0, winner: false, updatedAt: 1000 }
  }, 1500);
  assert.strictEqual(Object.hasOwn(portable, "projectorDraw"), false);
})();

(function rejectsMalformedOrIncompatibleFiles() {
  assert.throws(() => SessionFile.parse("não é json"), /json válido/i);
  assert.throws(() => SessionFile.parse(JSON.stringify({ type: "outro", version: 1, state: {} })), /sessão do sorteador/i);
  assert.throws(() => SessionFile.parse(JSON.stringify({
    type: "sorteador-grupos-session",
    version: 1,
    state: { groups: [[]], groupCount: 1, studentCount: 0, capacities: [0] }
  })), /grupos válidos/i);
})();

console.log("✓ arquivo portátil da sessão validado.");
