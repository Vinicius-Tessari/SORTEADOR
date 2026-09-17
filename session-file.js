(function (global) {
  "use strict";

  const TYPE = "sorteador-grupos-session";
  const FILE_VERSION = 1;
  const Logic = global.PresentationLogic || (typeof require !== "undefined" ? require("./presentation-logic.js") : null);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validateState(state) {
    if (!state || typeof state !== "object" || !Array.isArray(state.groups) || state.groups.length === 0) {
      throw new Error("O arquivo não contém grupos válidos.");
    }
    if (state.groups.some(group => !Array.isArray(group) || group.length === 0 || group.some(name => !String(name).trim()))) {
      throw new Error("O arquivo não contém grupos válidos.");
    }
    const studentCount = state.groups.reduce((sum, group) => sum + group.length, 0);
    if (state.groupCount !== state.groups.length || state.studentCount !== studentCount) {
      throw new Error("As quantidades da sessão não correspondem aos grupos.");
    }
    if (!Array.isArray(state.capacities) || state.capacities.length !== state.groups.length) {
      throw new Error("As capacidades dos grupos são inválidas.");
    }
    const normalized = state.groups.flat().map(name => String(name).trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR"));
    if (new Set(normalized).size !== normalized.length) {
      throw new Error("A sessão contém alunos duplicados.");
    }
    if (state.presentation && !Logic.isValidSession(state.presentation, state.groups)) {
      throw new Error("Os dados das apresentações são inválidos.");
    }
    return state;
  }

  function createPortableState(appState, nowMs = Date.now()) {
    const state = clone(appState);
    delete state.projectorDraw;
    if (state.presentation) {
      state.presentation = Logic.migrateSession(state.presentation, nowMs);
      if (state.presentation.phase === "cronometro" && !state.presentation.timerPaused) {
        state.presentation = Logic.pauseTimer(state.presentation, nowMs);
      }
    }
    return validateState(state);
  }

  function serialize(appState, nowMs = Date.now()) {
    return JSON.stringify({
      type: TYPE,
      version: FILE_VERSION,
      exportedAt: new Date(nowMs).toISOString(),
      state: createPortableState(appState, nowMs)
    }, null, 2);
  }

  function parse(text) {
    let file;
    try {
      file = JSON.parse(String(text));
    } catch (_) {
      throw new Error("Selecione um arquivo JSON válido.");
    }
    if (!file || file.type !== TYPE || file.version !== FILE_VERSION || !file.state) {
      throw new Error("O arquivo não é uma sessão do Sorteador de Grupos.");
    }
    const state = clone(file.state);
    if (state.presentation) state.presentation = Logic.migrateSession(state.presentation);
    return validateState(state);
  }

  const api = { TYPE, FILE_VERSION, createPortableState, serialize, parse };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SessionFile = api;
})(typeof window !== "undefined" ? window : globalThis);
