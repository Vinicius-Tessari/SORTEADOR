"use strict";

const assert = require("assert");
const Logic = require("../presentation-logic.js");

(function durationAndGradeValidation() {
  assert.strictEqual(Logic.parseDuration("2", "30"), 150);
  assert.strictEqual(Logic.parseDuration("0", "45"), 45);
  assert.throws(() => Logic.parseDuration("0", "0"), /maior que zero/i);
  assert.throws(() => Logic.parseDuration("1", "60"), /segundos/i);

  assert.strictEqual(Logic.parseGrade("8,75"), 8.75);
  assert.strictEqual(Logic.parseGrade("10"), 10);
  assert.strictEqual(Logic.parseGrade("0"), 0);
  assert.throws(() => Logic.parseGrade("10,01"), /entre 0 e 10/i);
  assert.throws(() => Logic.parseGrade("8,555"), /duas casas/i);
  assert.throws(() => Logic.parseGrade(""), /informe/i);

  assert.strictEqual(Logic.parseMaxGrade("7,5"), 7.5);
  assert.strictEqual(Logic.parseGrade("7,5", 7.5), 7.5);
  assert.throws(() => Logic.parseGrade("7,51", 7.5), /entre 0 e 7,5/i);
  assert.throws(() => Logic.parseMaxGrade("0"), /maior que zero/i);
  assert.throws(() => Logic.parseMaxGrade("100,01"), /até 100/i);
})();

(function sessionTransitionsAreImmutable() {
  const base = Logic.createSession([["Ana"], ["Bia", "Caio"]], 60);
  assert.strictEqual(base.maxGrade, 10);
  const first = Logic.drawNextGroup(base, () => 0.99);
  assert.strictEqual(base.currentGroupIndex, null);
  assert.strictEqual(first.currentGroupIndex, 1);
  assert.deepStrictEqual(first.drawnGroupIndexes, [1]);
  assert.strictEqual(first.phase, "pronto");

  const running = Logic.startCurrentGroup(first, 1000);
  assert.strictEqual(first.phase, "pronto");
  assert.strictEqual(running.phase, "cronometro");
  assert.strictEqual(running.endAt, 61000);

  const grading = Logic.finishCurrentGroup(running);
  assert.strictEqual(grading.phase, "avaliacao");
  assert.strictEqual(grading.endAt, null);
  assert.strictEqual(Logic.getRemainingSeconds(61000, 11000), 50);
  assert.strictEqual(Logic.getRemainingSeconds(61000, 62000), 0);
})();

(function savesAndEnforcesTheConfiguredMaximumGrade() {
  let session = Logic.createSession([["Ana"]], 30, 7.5);
  assert.strictEqual(session.version, 2);
  assert.strictEqual(session.maxGrade, 7.5);
  session = Logic.finishCurrentGroup(Logic.startCurrentGroup(Logic.drawNextGroup(session, () => 0), 0));
  assert.throws(() => Logic.saveGrades(session, [
    { student: "Ana", grade: "8", absent: false }
  ]), /entre 0 e 7,5/i);
  const saved = Logic.saveGrades(session, [
    { student: "Ana", grade: "7,25", absent: false }
  ]);
  assert.strictEqual(saved.grades[0].Ana.grade, 7.25);
})();

(function drawNeverRepeatsCompletedOrAlreadyDrawnGroups() {
  const session = Logic.createSession([["A"], ["B"], ["C"]], 30);
  const first = Logic.drawNextGroup(session, () => 0.5);
  const grading = Logic.finishCurrentGroup(Logic.startCurrentGroup(first, 0));
  const saved = Logic.saveGrades(grading, [{ student: "B", grade: "7", absent: false }]);
  const second = Logic.drawNextGroup(saved, () => 0.5);
  assert.notStrictEqual(second.currentGroupIndex, first.currentGroupIndex);
  assert.strictEqual(new Set(second.drawnGroupIndexes).size, 2);
})();

(function buildsAnExcitingDrawSequenceEndingAtTheWinner() {
  const pending = [0, 2, 4, 7];
  const randomValues = [0, 0.7, 0.3, 0.9];
  let randomIndex = 0;
  const sequence = Logic.buildDrawSequence(
    pending,
    4,
    () => randomValues[randomIndex++ % randomValues.length],
    12
  );

  assert.strictEqual(sequence.length, 12);
  assert.strictEqual(sequence.at(-1), 4);
  assert.ok(sequence.every(groupIndex => pending.includes(groupIndex)));
  assert.ok(new Set(sequence.slice(0, -1)).size > 1);
  assert.throws(() => Logic.buildDrawSequence([], 0), /grupos disponíveis/i);
  assert.throws(() => Logic.buildDrawSequence([0, 1], 2), /vencedor/i);
})();

(function savesIndividualGradesAndAbsences() {
  const grading = Logic.finishCurrentGroup(Logic.startCurrentGroup(Logic.drawNextGroup(
    Logic.createSession([["Zeca", "Ana"], ["Bia"]], 30), () => 0
  ), 1000));

  assert.throws(() => Logic.saveGrades(grading, [
    { student: "Zeca", grade: "8", absent: false }
  ]), /todos os alunos/i);

  const saved = Logic.saveGrades(grading, [
    { student: "Zeca", grade: "8,5", absent: false },
    { student: "Ana", grade: "", absent: true }
  ]);
  assert.deepStrictEqual(saved.grades[0].Ana, { grade: 0, status: "Ausente" });
  assert.deepStrictEqual(saved.grades[0].Zeca, { grade: 8.5, status: "Presente" });
  assert.strictEqual(saved.phase, "pronto");
  assert.strictEqual(saved.currentGroupIndex, null);

  const rows = Logic.buildExportRows(saved);
  assert.deepStrictEqual(rows[0], { Aluno: "Ana", Grupo: 1, Nota: 0, "Situação": "Ausente" });
  assert.deepStrictEqual(rows[1], { Aluno: "Zeca", Grupo: 1, Nota: 8.5, "Situação": "Presente" });
})();

(function completesOnlyAfterEveryGroupIsGraded() {
  let session = Logic.createSession([["Ana"], ["Bia"]], 10);
  session = Logic.drawNextGroup(session, () => 0);
  session = Logic.finishCurrentGroup(Logic.startCurrentGroup(session, 0));
  session = Logic.saveGrades(session, [{ student: "Ana", grade: "9", absent: false }]);
  assert.strictEqual(session.phase, "pronto");
  session = Logic.drawNextGroup(session, () => 0);
  session = Logic.finishCurrentGroup(Logic.startCurrentGroup(session, 0));
  session = Logic.saveGrades(session, [{ student: "Bia", grade: "", absent: true }]);
  assert.strictEqual(session.phase, "concluido");
  assert.strictEqual(session.completedGroupIndexes.length, 2);
})();

(function validatesRestoredSessionsAndBuildsSummary() {
  const groups = [["Ana"], ["Bia"]];
  let session = Logic.createSession(groups, 10);
  assert.strictEqual(Logic.isValidSession(session, groups), true);
  assert.strictEqual(Logic.isValidSession({ ...session, phase: "quebrado" }, groups), false);
  assert.strictEqual(Logic.isValidSession(session, [["Outro"]]), false);
  assert.strictEqual(Logic.formatClock(65), "01:05");

  session = Logic.drawNextGroup(session, () => 0);
  session = Logic.finishCurrentGroup(Logic.startCurrentGroup(session, 0));
  session = Logic.saveGrades(session, [{ student: "Ana", grade: "8", absent: false }]);
  session = Logic.drawNextGroup(session, () => 0);
  session = Logic.finishCurrentGroup(Logic.startCurrentGroup(session, 0));
  session = Logic.saveGrades(session, [{ student: "Bia", grade: "", absent: true }]);
  assert.deepStrictEqual(Logic.getSummary(session), {
    studentCount: 2,
    absentCount: 1,
    average: 4
  });
})();

console.log("✓ 8 conjuntos de testes de apresentação passaram.");
