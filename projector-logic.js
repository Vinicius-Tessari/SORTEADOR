(function (global) {
  "use strict";

  const DRAW_FRESHNESS_MS = 10000;

  function getDrawView(state, nowMs = Date.now()) {
    const draw = state && state.projectorDraw;
    if (!draw || !draw.active || !Number.isInteger(draw.groupIndex)) return null;
    if (!Number.isFinite(draw.updatedAt) || Number(nowMs) - draw.updatedAt > DRAW_FRESHNESS_MS) return null;
    if (!Array.isArray(state.groups) || !Array.isArray(state.groups[draw.groupIndex])) return null;
    return {
      status: draw.winner ? "Próximo grupo sorteado!" : "Sorteando o próximo grupo...",
      groupLabel: `Grupo ${draw.groupIndex + 1}`,
      members: draw.winner ? [...state.groups[draw.groupIndex]] : [],
      winner: Boolean(draw.winner)
    };
  }

  const api = { getDrawView };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.ProjectorLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
