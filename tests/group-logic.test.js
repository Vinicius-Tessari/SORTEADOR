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

console.log("✓ 7 testes de lógica passaram.");
