"use strict";

const STORAGE_KEY = "sorteadorGruposState";
const projectorStatus = document.getElementById("projectorStatus");
const projectorGroup = document.getElementById("projectorGroup");
const projectorTimer = document.getElementById("projectorTimer");
const projectorMembers = document.getElementById("projectorMembers");

let projectorState = loadState();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (_) {
    return null;
  }
}

function setMembers(members = []) {
  projectorMembers.replaceChildren();
  members.forEach((member, index) => {
    const item = document.createElement("li");
    const number = document.createElement("span");
    const name = document.createElement("strong");
    number.textContent = String(index + 1);
    name.textContent = member;
    item.append(number, name);
    projectorMembers.appendChild(item);
  });
}

function showWaiting(status = "Aguardando o professor") {
  document.body.classList.remove("is-drawing", "is-draw-winner");
  projectorStatus.textContent = status;
  projectorGroup.textContent = "Aguardando...";
  projectorTimer.textContent = "--:--";
  projectorTimer.classList.remove("is-paused", "is-warning");
  setMembers();
}

function renderProjector() {
  const drawView = ProjectorLogic.getDrawView(projectorState, Date.now());
  if (drawView) {
    document.body.classList.toggle("is-drawing", !drawView.winner);
    document.body.classList.toggle("is-draw-winner", drawView.winner);
    projectorStatus.textContent = drawView.status;
    projectorGroup.textContent = drawView.groupLabel;
    projectorTimer.textContent = drawView.winner ? "✓" : "•••";
    projectorTimer.classList.remove("is-paused", "is-warning");
    setMembers(drawView.members);
    return;
  }
  document.body.classList.remove("is-drawing", "is-draw-winner");
  const presentation = projectorState && projectorState.presentation;
  if (!presentation || !Array.isArray(presentation.groups)) {
    showWaiting("Aguardando configuração");
    return;
  }

  if (presentation.phase === "concluido") {
    showWaiting("Todas as apresentações foram concluídas");
    projectorGroup.textContent = "Obrigado!";
    projectorTimer.textContent = "✓";
    return;
  }

  if (presentation.currentGroupIndex === null) {
    showWaiting("Aguardando o próximo sorteio");
    return;
  }

  const groupIndex = presentation.currentGroupIndex;
  projectorGroup.textContent = `Grupo ${groupIndex + 1}`;
  setMembers(presentation.groups[groupIndex]);

  if (presentation.phase === "pronto") {
    projectorStatus.textContent = "Próximo grupo sorteado";
    projectorTimer.textContent = PresentationLogic.formatClock(presentation.durationSeconds);
  } else if (presentation.phase === "avaliacao") {
    projectorStatus.textContent = "Apresentação encerrada";
    projectorTimer.textContent = "00:00";
  } else {
    const remaining = PresentationLogic.getSessionRemainingSeconds(presentation, Date.now());
    projectorStatus.textContent = presentation.timerPaused ? "Apresentação pausada" : "Apresentação em andamento";
    projectorTimer.textContent = PresentationLogic.formatClock(remaining);
    projectorTimer.classList.toggle("is-paused", presentation.timerPaused);
    projectorTimer.classList.toggle("is-warning", remaining <= 30);
  }
}

window.addEventListener("storage", event => {
  if (event.key !== STORAGE_KEY) return;
  projectorState = loadState();
  renderProjector();
});

setInterval(renderProjector, 250);
renderProjector();
