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

  function cleanName(name) {
    const cleaned = String(name || "").trim().replace(/\s+/g, " ");
    if (cleaned.length < 3) throw new Error("Informe o nome completo do aluno.");
    return cleaned;
  }

  function cloneGroups(groups) {
    if (!Array.isArray(groups) || groups.length === 0 || groups.some(group => !Array.isArray(group))) {
      throw new Error("Estrutura de grupos inválida.");
    }
    return groups.map(group => [...group]);
  }

  function assertGroupIndex(groups, index) {
    if (!Number.isInteger(index) || !groups[index]) throw new Error("Grupo inválido.");
  }

  function assertUniqueName(name, groups) {
    if (isDuplicateName(name, groups)) throw new Error("Esse aluno já está nos grupos.");
  }

  function updateGroups(groups, operation) {
    const next = cloneGroups(groups);
    if (!operation || typeof operation !== "object") throw new Error("Operação de edição inválida.");

    if (operation.type === "addGroup") {
      next.push([]);
      return next;
    }

    assertGroupIndex(next, operation.groupIndex);

    if (operation.type === "removeGroup") {
      if (next.length === 1) throw new Error("Não é possível remover o único grupo.");
      if (next[operation.groupIndex].length > 0) throw new Error("Remova ou mova os alunos antes de excluir o grupo.");
      next.splice(operation.groupIndex, 1);
      return next;
    }

    if (operation.type === "add") {
      const name = cleanName(operation.name);
      assertUniqueName(name, next);
      next[operation.groupIndex].push(name);
      return next;
    }

    const studentIndex = operation.studentIndex;
    if (!Number.isInteger(studentIndex) || typeof next[operation.groupIndex][studentIndex] !== "string") {
      throw new Error("Aluno inválido.");
    }

    if (operation.type === "remove") {
      next[operation.groupIndex].splice(studentIndex, 1);
      return next;
    }

    if (operation.type === "rename") {
      const name = cleanName(operation.name);
      const withoutCurrent = next.map((group, groupIndex) => group.filter((_, index) => (
        groupIndex !== operation.groupIndex || index !== studentIndex
      )));
      assertUniqueName(name, withoutCurrent);
      next[operation.groupIndex][studentIndex] = name;
      return next;
    }

    if (operation.type === "move") {
      assertGroupIndex(next, operation.targetGroupIndex);
      if (operation.targetGroupIndex === operation.groupIndex) return next;
      const [student] = next[operation.groupIndex].splice(studentIndex, 1);
      next[operation.targetGroupIndex].push(student);
      return next;
    }

    throw new Error("Operação de edição inválida.");
  }

  function validateEditedGroups(groups) {
    const normalized = cloneGroups(groups).map((group, groupIndex) => {
      if (group.length === 0) throw new Error(`O Grupo ${groupIndex + 1} está vazio.`);
      return group.map(cleanName);
    });
    const seen = new Set();
    normalized.flat().forEach(name => {
      const key = normalizeName(name);
      if (seen.has(key)) throw new Error(`Aluno duplicado: ${name}.`);
      seen.add(key);
    });
    return normalized;
  }

  const api = {
    shuffle,
    createBalancedCapacities,
    chooseAvailableGroup,
    normalizeName,
    isDuplicateName,
    totalAllocated,
    allGroupsComplete,
    updateGroups,
    validateEditedGroups
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.GroupLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
