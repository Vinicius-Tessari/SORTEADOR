const assert = require("assert");
const Logic = require("../group-logic.js");

function fixedRandom(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

(function testBalancedCapacitiesSum() {
  const capacities = Logic.createBalancedCapacities(5, 23, fixedRandom([0.1, 0.7, 0.3, 0.9, 0.2]));
  assert.strictEqual(capacities.reduce((a, b) => a + b, 0), 23);
  assert.strictEqual(capacities.length, 5);
  assert.ok(Math.max(...capacities) - Math.min(...capacities) <= 1);
})();

(function testDivisibleCapacities() {
  const capacities = Logic.createBalancedCapacities(4, 20);
  assert.deepStrictEqual(capacities, [5, 5, 5, 5]);
})();

(function testRejectsMoreGroupsThanStudents() {
  assert.throws(() => Logic.createBalancedCapacities(6, 5), /não pode ser maior/i);
})();

(function testChooseAvailableGroupNeverSelectsFull() {
  const groups = [["A", "B"], ["C"], []];
  const capacities = [2, 1, 2];
  for (let i = 0; i < 20; i++) {
    assert.strictEqual(Logic.chooseAvailableGroup(groups, capacities), 2);
  }
})();

(function testDuplicateNamesIgnoreCaseAndExtraSpaces() {
  const groups = [["Ana Maria Souza"], []];
  assert.strictEqual(Logic.isDuplicateName("  ANA   maria   souza ", groups), true);
  assert.strictEqual(Logic.isDuplicateName("João Silva", groups), false);
})();

(function testCompletion() {
  assert.strictEqual(Logic.allGroupsComplete([["A"], ["B"]], [1, 1]), true);
  assert.strictEqual(Logic.allGroupsComplete([["A"], []], [1, 1]), false);
})();

(function testAllocationRandomAcrossAvailableGroups() {
  const groups = [[], [], []];
  const capacities = [1, 1, 1];
  assert.strictEqual(Logic.chooseAvailableGroup(groups, capacities, () => 0), 0);
  assert.strictEqual(Logic.chooseAvailableGroup(groups, capacities, () => 0.5), 1);
  assert.strictEqual(Logic.chooseAvailableGroup(groups, capacities, () => 0.999), 2);
})();

(function editsGroupsWithoutMutatingTheOriginal() {
  const original = [["Ana", "Bia"], ["Caio"]];
  const renamed = Logic.updateGroups(original, { type: "rename", groupIndex: 0, studentIndex: 1, name: "Beatriz" });
  assert.deepStrictEqual(renamed, [["Ana", "Beatriz"], ["Caio"]]);
  assert.deepStrictEqual(original, [["Ana", "Bia"], ["Caio"]]);

  const added = Logic.updateGroups(renamed, { type: "add", groupIndex: 1, name: "Davi" });
  assert.deepStrictEqual(added[1], ["Caio", "Davi"]);

  const moved = Logic.updateGroups(added, { type: "move", groupIndex: 0, studentIndex: 0, targetGroupIndex: 1 });
  assert.deepStrictEqual(moved, [["Beatriz"], ["Caio", "Davi", "Ana"]]);

  const removed = Logic.updateGroups(moved, { type: "remove", groupIndex: 1, studentIndex: 1 });
  assert.deepStrictEqual(removed, [["Beatriz"], ["Caio", "Ana"]]);
})();

(function addsAndRemovesGroupsAndValidatesTheFinalFormation() {
  const withEmptyGroup = Logic.updateGroups([["Ana"], ["Bia"]], { type: "addGroup" });
  assert.deepStrictEqual(withEmptyGroup, [["Ana"], ["Bia"], []]);
  assert.throws(() => Logic.validateEditedGroups(withEmptyGroup), /grupo 3.*vazio/i);

  const filled = Logic.updateGroups(withEmptyGroup, { type: "add", groupIndex: 2, name: "Caio" });
  assert.deepStrictEqual(Logic.validateEditedGroups(filled), [["Ana"], ["Bia"], ["Caio"]]);

  const removed = Logic.updateGroups([["Ana"], ["Bia"], []], { type: "removeGroup", groupIndex: 2 });
  assert.deepStrictEqual(removed, [["Ana"], ["Bia"]]);
  assert.throws(() => Logic.updateGroups([["Ana"]], { type: "removeGroup", groupIndex: 0 }), /único grupo/i);
})();

(function rejectsInvalidOrDuplicateNamesWhileEditing() {
  assert.throws(
    () => Logic.updateGroups([["Ana"], ["Bia"]], { type: "rename", groupIndex: 1, studentIndex: 0, name: " ana " }),
    /já está nos grupos/i
  );
  assert.throws(
    () => Logic.updateGroups([["Ana"]], { type: "add", groupIndex: 0, name: "  " }),
    /nome completo/i
  );
  assert.throws(() => Logic.validateEditedGroups([["Ana"], [" ana "]]), /duplicado/i);
})();

console.log("✓ 10 testes de lógica passaram.");
