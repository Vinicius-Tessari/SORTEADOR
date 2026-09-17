(function (global) {
  "use strict";

  function toInteger(value, label) {
    const text = String(value ?? "").trim();
    const number = Number(text);
    if (text === "" || !Number.isInteger(number) || number < 0) {
      throw new Error(`${label} deve ser um número inteiro válido.`);
    }
    return number;
  }

  function parseDuration(minutes, seconds) {
    const parsedMinutes = toInteger(minutes, "Minutos");
    const parsedSeconds = toInteger(seconds, "Segundos");
    if (parsedSeconds > 59) {
      throw new Error("Segundos devem estar entre 0 e 59.");
    }
    const total = parsedMinutes * 60 + parsedSeconds;
    if (total <= 0) {
      throw new Error("A duração deve ser maior que zero.");
    }
    return total;
  }

  function parseDecimal(value, emptyMessage) {
    const text = String(value ?? "").trim();
    if (!text) throw new Error(emptyMessage);
    const separatorMatch = text.match(/[.,](\d*)$/);
    if (separatorMatch && separatorMatch[1].length > 2) {
      throw new Error("Use no máximo duas casas decimais.");
    }
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) {
      throw new Error("Informe um valor decimal válido.");
    }
    return Number(text.replace(",", "."));
  }

  function parseMaxGrade(value) {
    const number = parseDecimal(value, "Informe a nota máxima.");
    if (number <= 0) throw new Error("A nota máxima deve ser maior que zero.");
    if (number > 100) throw new Error("A nota máxima pode ser de até 100.");
    return number;
  }

  function parseGrade(value, maxGrade = 10) {
    const maximum = parseMaxGrade(maxGrade);
    const number = parseDecimal(value, "Informe uma nota.");
    if (number < 0 || number > maximum) {
      const formattedMaximum = maximum.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
      throw new Error(`A nota deve estar entre 0 e ${formattedMaximum}.`);
    }
    return number;
  }

  function validateGroups(groups) {
    if (!Array.isArray(groups) || groups.length === 0 || groups.some(group => !Array.isArray(group) || group.length === 0)) {
      throw new Error("É necessário ter grupos formados para iniciar as apresentações.");
    }
    return groups.map(group => group.map(student => String(student).trim()));
  }

  function cloneSession(session) {
    return {
      ...session,
      groups: session.groups.map(group => [...group]),
      drawnGroupIndexes: [...session.drawnGroupIndexes],
      completedGroupIndexes: [...session.completedGroupIndexes],
      grades: Object.fromEntries(
        Object.entries(session.grades).map(([groupIndex, groupGrades]) => [
          groupIndex,
          Object.fromEntries(Object.entries(groupGrades).map(([student, grade]) => [student, { ...grade }]))
        ])
      )
    };
  }

  function createSession(groups, durationSeconds, maxGrade = 10) {
    const normalizedGroups = validateGroups(groups);
    const duration = Number(durationSeconds);
    if (!Number.isInteger(duration) || duration <= 0) {
      throw new Error("A duração deve ser maior que zero.");
    }
    const maximumGrade = parseMaxGrade(maxGrade);
    return {
      version: 2,
      groups: normalizedGroups,
      durationSeconds: duration,
      maxGrade: maximumGrade,
      phase: "pronto",
      drawnGroupIndexes: [],
      completedGroupIndexes: [],
      currentGroupIndex: null,
      endAt: null,
      grades: {}
    };
  }

  function drawNextGroup(session, randomFn = Math.random) {
    if (session.phase !== "pronto" || session.currentGroupIndex !== null) {
      throw new Error("A sessão não está pronta para um novo sorteio.");
    }
    const unavailable = new Set([...session.drawnGroupIndexes, ...session.completedGroupIndexes]);
    const pending = session.groups
      .map((_, index) => index)
      .filter(index => !unavailable.has(index));
    if (pending.length === 0) throw new Error("Todos os grupos já apresentaram.");
    const position = Math.min(pending.length - 1, Math.floor(randomFn() * pending.length));
    const groupIndex = pending[position];
    const next = cloneSession(session);
    next.currentGroupIndex = groupIndex;
    next.drawnGroupIndexes.push(groupIndex);
    return next;
  }

  function buildDrawSequence(pendingGroupIndexes, winnerIndex, randomFn = Math.random, length = 18) {
    if (!Array.isArray(pendingGroupIndexes) || pendingGroupIndexes.length === 0) {
      throw new Error("Informe os grupos disponíveis para a animação.");
    }
    if (!pendingGroupIndexes.includes(winnerIndex)) {
      throw new Error("O grupo vencedor precisa estar entre os grupos disponíveis.");
    }

    const sequenceLength = Math.max(2, Math.floor(Number(length) || 18));
    const sequence = [];
    let previous = null;

    for (let index = 0; index < sequenceLength - 1; index += 1) {
      const candidates = pendingGroupIndexes.length > 1
        ? pendingGroupIndexes.filter(groupIndex => groupIndex !== previous)
        : pendingGroupIndexes;
      const position = Math.min(candidates.length - 1, Math.floor(randomFn() * candidates.length));
      previous = candidates[position];
      sequence.push(previous);
    }

    sequence.push(winnerIndex);
    return sequence;
  }

  function startCurrentGroup(session, nowMs = Date.now()) {
    if (session.phase !== "pronto" || session.currentGroupIndex === null) {
      throw new Error("Sorteie um grupo antes de começar.");
    }
    const next = cloneSession(session);
    next.phase = "cronometro";
    next.endAt = Number(nowMs) + next.durationSeconds * 1000;
    return next;
  }

  function finishCurrentGroup(session) {
    if (session.phase !== "cronometro" || session.currentGroupIndex === null) {
      throw new Error("Não há apresentação em andamento.");
    }
    const next = cloneSession(session);
    next.phase = "avaliacao";
    next.endAt = null;
    return next;
  }

  function getRemainingSeconds(endAt, nowMs = Date.now()) {
    return Math.max(0, Math.ceil((Number(endAt) - Number(nowMs)) / 1000));
  }

  function saveGrades(session, entries) {
    if (session.phase !== "avaliacao" || session.currentGroupIndex === null) {
      throw new Error("Não há grupo aguardando avaliação.");
    }
    const groupIndex = session.currentGroupIndex;
    const students = session.groups[groupIndex];
    if (!Array.isArray(entries) || entries.length !== students.length) {
      throw new Error("Preencha a avaliação de todos os alunos.");
    }
    const byStudent = new Map(entries.map(entry => [entry.student, entry]));
    if (byStudent.size !== students.length || students.some(student => !byStudent.has(student))) {
      throw new Error("Preencha a avaliação de todos os alunos.");
    }

    const groupGrades = {};
    students.forEach(student => {
      const entry = byStudent.get(student);
      groupGrades[student] = entry.absent
        ? { grade: 0, status: "Ausente" }
        : { grade: parseGrade(entry.grade, session.maxGrade), status: "Presente" };
    });

    const next = cloneSession(session);
    next.grades[groupIndex] = groupGrades;
    if (!next.completedGroupIndexes.includes(groupIndex)) {
      next.completedGroupIndexes.push(groupIndex);
    }
    next.currentGroupIndex = null;
    next.endAt = null;
    next.phase = next.completedGroupIndexes.length === next.groups.length ? "concluido" : "pronto";
    return next;
  }

  function buildExportRows(session) {
    const rows = [];
    session.groups.forEach((students, groupIndex) => {
      const groupGrades = session.grades[groupIndex] || {};
      [...students]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .forEach(student => {
          const evaluation = groupGrades[student];
          if (!evaluation) return;
          rows.push({
            Aluno: student,
            Grupo: groupIndex + 1,
            Nota: evaluation.grade,
            "Situação": evaluation.status
          });
        });
    });
    return rows;
  }

  function isValidSession(session, groups) {
    const phases = new Set(["pronto", "cronometro", "avaliacao", "concluido"]);
    if (!session || typeof session !== "object" || session.version !== 2) return false;
    if (!phases.has(session.phase) || !Number.isInteger(session.durationSeconds) || session.durationSeconds <= 0) return false;
    if (!Number.isFinite(session.maxGrade) || session.maxGrade <= 0 || session.maxGrade > 100) return false;
    if (!Array.isArray(session.groups) || JSON.stringify(session.groups) !== JSON.stringify(groups)) return false;
    if (!Array.isArray(session.drawnGroupIndexes) || !Array.isArray(session.completedGroupIndexes)) return false;
    if (!session.grades || typeof session.grades !== "object") return false;
    if (session.currentGroupIndex !== null && (!Number.isInteger(session.currentGroupIndex) || !session.groups[session.currentGroupIndex])) return false;
    if (session.phase === "cronometro" && !Number.isFinite(session.endAt)) return false;
    return true;
  }

  function formatClock(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function getSummary(session) {
    const rows = buildExportRows(session);
    const total = rows.reduce((sum, row) => sum + row.Nota, 0);
    return {
      studentCount: rows.length,
      absentCount: rows.filter(row => row["Situação"] === "Ausente").length,
      average: rows.length ? Math.round((total / rows.length) * 100) / 100 : 0
    };
  }

  const api = {
    parseDuration,
    parseMaxGrade,
    parseGrade,
    createSession,
    drawNextGroup,
    buildDrawSequence,
    startCurrentGroup,
    finishCurrentGroup,
    getRemainingSeconds,
    saveGrades,
    buildExportRows,
    isValidSession,
    formatClock,
    getSummary
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.PresentationLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
