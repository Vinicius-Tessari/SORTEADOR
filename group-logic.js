(function (global) {
  "use strict";

  function assertPositiveInteger(value, label) {
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
      throw new Error(`${label} deve ser um número inteiro maior que zero.`);
    }
    return number;
  }

  function shuffle(array, randomFn = Math.random) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function createBalancedCapacities(groupCount, studentCount, randomFn = Math.random) {
    const groups = assertPositiveInteger(groupCount, "Quantidade de grupos");
    const students = assertPositiveInteger(studentCount, "Quantidade de alunos");

    if (groups > students) {
      throw new Error("A quantidade de grupos não pode ser maior que a quantidade de alunos.");
    }

    const base = Math.floor(students / groups);
    const remainder = students % groups;
    const capacities = Array(groups).fill(base);
    const shuffledIndexes = shuffle(
      Array.from({ length: groups }, (_, index) => index),
      randomFn
    );

    for (let i = 0; i < remainder; i++) {
      capacities[shuffledIndexes[i]] += 1;
    }

    return capacities;
  }

  function chooseAvailableGroup(groups, capacities, randomFn = Math.random) {
    if (!Array.isArray(groups) || !Array.isArray(capacities) || groups.length !== capacities.length) {
      throw new Error("Estrutura de grupos inválida.");
    }

    const available = groups
      .map((members, index) => ({ index, remaining: capacities[index] - members.length }))
      .filter(item => item.remaining > 0)
      .map(item => item.index);

    if (available.length === 0) {
      throw new Error("Todos os grupos já estão completos.");
    }

    return available[Math.floor(randomFn() * available.length)];
  }

  function normalizeName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("pt-BR");
  }

  function isDuplicateName(name, groups) {
    const normalized = normalizeName(name);
    return groups.some(group =>
      group.some(member => normalizeName(member) === normalized)
    );
  }

  function totalAllocated(groups) {
    return groups.reduce((sum, group) => sum + group.length, 0);
  }

  function allGroupsComplete(groups, capacities) {
    return groups.every((group, index) => group.length === capacities[index]);
  }

  const api = {
    shuffle,
    createBalancedCapacities,
    chooseAvailableGroup,
    normalizeName,
    isDuplicateName,
    totalAllocated,
    allGroupsComplete
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.GroupLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
