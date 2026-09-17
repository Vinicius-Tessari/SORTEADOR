"use strict";

const assert = require("assert");
const ProjectorLogic = require("../projector-logic.js");

(function showsEachTemporaryRouletteGroupWithoutRevealingMembers() {
  const state = {
    groups: [["Ana"], ["Bia", "Caio"]],
    projectorDraw: { active: true, groupIndex: 1, winner: false, updatedAt: 1000 }
  };
  assert.deepStrictEqual(ProjectorLogic.getDrawView(state, 1500), {
    status: "Sorteando o próximo grupo...",
    groupLabel: "Grupo 2",
    members: [],
    winner: false
  });
})();

(function revealsTheWinnerAndItsMembers() {
  const state = {
    groups: [["Ana"], ["Bia", "Caio"]],
    projectorDraw: { active: true, groupIndex: 1, winner: true, updatedAt: 1000 }
  };
  assert.deepStrictEqual(ProjectorLogic.getDrawView(state, 1500), {
    status: "Próximo grupo sorteado!",
    groupLabel: "Grupo 2",
    members: ["Bia", "Caio"],
    winner: true
  });
})();

(function ignoresAnInterruptedStaleAnimation() {
  const state = {
    groups: [["Ana"]],
    projectorDraw: { active: true, groupIndex: 0, winner: false, updatedAt: 1000 }
  };
  assert.strictEqual(ProjectorLogic.getDrawView(state, 12000), null);
  assert.strictEqual(ProjectorLogic.getDrawView({ groups: [["Ana"]] }, 1000), null);
})();

console.log("✓ sincronização do sorteio com o projetor validada.");
