"use strict";

const STORAGE_KEY = "sorteadorGruposState";

const panels = {
  missing: document.getElementById("missingPanel"),
  config: document.getElementById("configPanel"),
  ready: document.getElementById("readyPanel"),
  timer: document.getElementById("timerPanel"),
  grading: document.getElementById("gradingPanel"),
  complete: document.getElementById("completePanel")
};

const durationForm = document.getElementById("durationForm");
const durationMinutes = document.getElementById("durationMinutes");
const durationSeconds = document.getElementById("durationSeconds");
const maximumGrade = document.getElementById("maximumGrade");
const durationError = document.getElementById("durationError");
const progressPanel = document.getElementById("progressPanel");
const progressText = document.getElementById("presentationProgressText");
const progressFill = document.getElementById("presentationProgressFill");
const sessionSubtitle = document.getElementById("sessionSubtitle");
const resetButton = document.getElementById("resetPresentationButton");
const drawPrompt = document.getElementById("drawPrompt");
const drawAnimation = document.getElementById("drawAnimation");
const rouletteGroupNumber = document.getElementById("rouletteGroupNumber");
const rouletteStatus = document.getElementById("rouletteStatus");
const celebrationParticles = document.getElementById("celebrationParticles");
const selectedGroup = document.getElementById("selectedGroup");
const selectedGroupNumber = document.getElementById("selectedGroupNumber");
const selectedGroupMembers = document.getElementById("selectedGroupMembers");
const drawGroupButton = document.getElementById("drawGroupButton");
const startTimerButton = document.getElementById("startTimerButton");
const timerGroupName = document.getElementById("timerGroupName");
const timerDisplay = document.getElementById("timerDisplay");
const timerFill = document.getElementById("timerFill");
const timerMembers = document.getElementById("timerMembers");
const finishTimerButton = document.getElementById("finishTimerButton");
const gradingTitle = document.getElementById("gradingTitle");
const gradingForm = document.getElementById("gradingForm");
const gradingList = document.getElementById("gradingList");
const gradingError = document.getElementById("gradingError");
const completionSummary = document.getElementById("completionSummary");
const downloadButton = document.getElementById("downloadWorkbookButton");
const timerAlarm = PresentationAlarm.createAlarm(window);

let appState = loadAppState();
let timerInterval = null;
let restoreNotice = "";
let isDrawingGroup = false;

function loadAppState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (_) {
    return null;
  }
}

function hasCompleteGroups(state) {
  return Boolean(
    state &&
    Array.isArray(state.groups) &&
    state.groups.length > 0 &&
    state.groups.every(group => Array.isArray(group) && group.length > 0) &&
    Number.isInteger(state.studentCount) &&
    state.groups.reduce((sum, group) => sum + group.length, 0) === state.studentCount
  );
}

function saveAppState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function hidePanels() {
  Object.values(panels).forEach(panel => panel.classList.add("hidden"));
}

function showPanel(name) {
  hidePanels();
  panels[name].classList.remove("hidden");
}

function stopTimerUpdates() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function fillMemberList(list, members) {
  list.replaceChildren();
  members.forEach((member, index) => {
    const item = document.createElement("li");
    const badge = document.createElement("span");
    const name = document.createElement("strong");
    badge.textContent = String(index + 1);
    name.textContent = member;
    item.style.setProperty("--member-delay", `${index * 85}ms`);
    item.append(badge, name);
    list.appendChild(item);
  });
}

function updateProgress(session) {
  const completed = session.completedGroupIndexes.length;
  const total = session.groups.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  progressText.textContent = `${completed} de ${total} ${total === 1 ? "grupo" : "grupos"}`;
  progressFill.style.width = `${percent}%`;
}

function getCurrentGroup(session) {
  return session.groups[session.currentGroupIndex];
}

function renderReady(session) {
  showPanel("ready");
  drawAnimation.classList.add("hidden");
  drawAnimation.classList.remove("is-spinning", "is-winner");
  selectedGroup.classList.remove("winner-reveal");
  if (session.currentGroupIndex === null) {
    drawPrompt.classList.remove("hidden");
    selectedGroup.classList.add("hidden");
    sessionSubtitle.textContent = "Sorteie o próximo grupo para apresentar.";
    return;
  }
  drawPrompt.classList.add("hidden");
  selectedGroup.classList.remove("hidden");
  selectedGroupNumber.textContent = `Grupo ${session.currentGroupIndex + 1}`;
  fillMemberList(selectedGroupMembers, getCurrentGroup(session));
  sessionSubtitle.textContent = `Grupo ${session.currentGroupIndex + 1} pronto para começar.`;
}

function getPendingGroupIndexes(session) {
  const unavailable = new Set([...session.drawnGroupIndexes, ...session.completedGroupIndexes]);
  return session.groups.map((_, index) => index).filter(index => !unavailable.has(index));
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function animateGroupDraw(previousSession, winnerIndex) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pendingGroupIndexes = getPendingGroupIndexes(previousSession);
  const sequence = PresentationLogic.buildDrawSequence(
    pendingGroupIndexes,
    winnerIndex,
    Math.random,
    reducedMotion ? 2 : 18
  );

  drawPrompt.classList.add("hidden");
  selectedGroup.classList.add("hidden");
  drawAnimation.classList.remove("hidden", "is-winner");
  drawAnimation.classList.add("is-spinning");
  rouletteStatus.textContent = reducedMotion ? "Definindo o próximo grupo..." : "Misturando os grupos...";
  sessionSubtitle.textContent = "Sorteio em andamento...";

  for (let index = 0; index < sequence.length; index += 1) {
    rouletteGroupNumber.textContent = `Grupo ${sequence[index] + 1}`;
    if (index === sequence.length - 5) rouletteStatus.textContent = "Quase lá...";
    if (index < sequence.length - 1) {
      const progress = index / Math.max(1, sequence.length - 2);
      await wait(reducedMotion ? 40 : 55 + Math.round(progress * progress * 190));
    }
  }

  drawAnimation.classList.remove("is-spinning");
  drawAnimation.classList.add("is-winner");
  celebrationParticles.classList.remove("burst");
  void celebrationParticles.offsetWidth;
  celebrationParticles.classList.add("burst");
  rouletteStatus.textContent = "É o próximo a apresentar!";
  await wait(reducedMotion ? 180 : 900);
}

function updateTimer(session) {
  const remaining = PresentationLogic.getRemainingSeconds(session.endAt, Date.now());
  timerDisplay.textContent = PresentationLogic.formatClock(remaining);
  timerFill.style.width = `${Math.round((remaining / session.durationSeconds) * 100)}%`;
  timerDisplay.classList.toggle("timer-warning", remaining <= 30);
  if (remaining === 0) {
    stopTimerUpdates();
    timerAlarm.play();
    appState.presentation = PresentationLogic.finishCurrentGroup(session);
    saveAppState();
    render();
  }
}

function renderTimer(session) {
  showPanel("timer");
  timerGroupName.textContent = `Grupo ${session.currentGroupIndex + 1}`;
  fillMemberList(timerMembers, getCurrentGroup(session));
  sessionSubtitle.textContent = `Grupo ${session.currentGroupIndex + 1} está apresentando.`;
  updateTimer(session);
  if (appState.presentation.phase === "cronometro" && timerInterval === null) {
    timerInterval = setInterval(() => updateTimer(appState.presentation), 250);
  }
}

function createGradeRow(student, index, maxGrade) {
  const row = document.createElement("div");
  row.className = "grade-row";
  row.dataset.student = student;

  const identity = document.createElement("div");
  identity.className = "grade-student";
  const badge = document.createElement("span");
  badge.textContent = String(index + 1);
  const name = document.createElement("strong");
  name.textContent = student;
  identity.append(badge, name);

  const gradeLabel = document.createElement("label");
  gradeLabel.className = "field grade-field";
  const gradeText = document.createElement("span");
  const formattedMaximum = maxGrade.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  gradeText.textContent = `Nota (0 a ${formattedMaximum})`;
  const gradeInput = document.createElement("input");
  gradeInput.className = "grade-input";
  gradeInput.type = "text";
  gradeInput.inputMode = "decimal";
  gradeInput.placeholder = `Máximo ${formattedMaximum}`;
  gradeInput.autocomplete = "off";
  gradeLabel.append(gradeText, gradeInput);

  const absentLabel = document.createElement("label");
  absentLabel.className = "absent-toggle";
  const absentInput = document.createElement("input");
  absentInput.className = "absent-input";
  absentInput.type = "checkbox";
  const absentText = document.createElement("span");
  absentText.textContent = "Ausente";
  absentLabel.append(absentInput, absentText);

  absentInput.addEventListener("change", () => {
    gradeInput.disabled = absentInput.checked;
    gradeInput.value = absentInput.checked ? "0" : "";
    row.classList.toggle("is-absent", absentInput.checked);
  });

  row.append(identity, gradeLabel, absentLabel);
  return row;
}

function renderGrading(session) {
  showPanel("grading");
  gradingTitle.textContent = `Avaliar Grupo ${session.currentGroupIndex + 1}`;
  sessionSubtitle.textContent = "Registre a nota individual de cada aluno.";
  gradingError.textContent = "";
  gradingList.replaceChildren();
  getCurrentGroup(session).forEach((student, index) => gradingList.appendChild(createGradeRow(student, index, session.maxGrade)));
  const firstInput = gradingList.querySelector(".grade-input");
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function renderComplete(session) {
  showPanel("complete");
  const summary = PresentationLogic.getSummary(session);
  const average = summary.average.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const studentLabel = summary.studentCount === 1 ? "aluno avaliado" : "alunos avaliados";
  const absentLabel = summary.absentCount === 1 ? "ausente" : "ausentes";
  completionSummary.textContent = `${summary.studentCount} ${studentLabel}, ${summary.absentCount} ${absentLabel} e média geral ${average}.`;
  sessionSubtitle.textContent = "Avaliações concluídas. Baixe a planilha final.";
}

function render() {
  stopTimerUpdates();
  if (!hasCompleteGroups(appState)) {
    progressPanel.classList.add("hidden");
    resetButton.classList.add("hidden");
    sessionSubtitle.textContent = "Forme os grupos antes de iniciar as apresentações.";
    showPanel("missing");
    return;
  }

  const session = appState.presentation;
  if (!session) {
    progressPanel.classList.add("hidden");
    resetButton.classList.add("hidden");
    sessionSubtitle.textContent = "Configure o tempo para começar.";
    durationError.textContent = restoreNotice;
    showPanel("config");
    return;
  }

  progressPanel.classList.remove("hidden");
  resetButton.classList.remove("hidden");
  updateProgress(session);

  if (session.phase === "pronto") renderReady(session);
  else if (session.phase === "cronometro") renderTimer(session);
  else if (session.phase === "avaliacao") renderGrading(session);
  else renderComplete(session);
}

durationForm.addEventListener("submit", event => {
  event.preventDefault();
  durationError.textContent = "";
  try {
    const totalSeconds = PresentationLogic.parseDuration(durationMinutes.value, durationSeconds.value);
    const maxGrade = PresentationLogic.parseMaxGrade(maximumGrade.value);
    appState.presentation = PresentationLogic.createSession(appState.groups, totalSeconds, maxGrade);
    saveAppState();
    render();
  } catch (error) {
    durationError.textContent = error.message;
  }
});

drawGroupButton.addEventListener("click", async () => {
  if (isDrawingGroup) return;
  isDrawingGroup = true;
  drawGroupButton.disabled = true;
  resetButton.disabled = true;
  const previousSession = appState.presentation;

  try {
    appState.presentation = PresentationLogic.drawNextGroup(previousSession);
    saveAppState();
    await animateGroupDraw(previousSession, appState.presentation.currentGroupIndex);
    render();
    selectedGroup.classList.add("winner-reveal");
    setTimeout(() => selectedGroup.classList.remove("winner-reveal"), 1200);
  } finally {
    isDrawingGroup = false;
    drawGroupButton.disabled = false;
    resetButton.disabled = false;
  }
});

startTimerButton.addEventListener("click", () => {
  timerAlarm.arm();
  appState.presentation = PresentationLogic.startCurrentGroup(appState.presentation, Date.now());
  saveAppState();
  render();
});

finishTimerButton.addEventListener("click", () => {
  appState.presentation = PresentationLogic.finishCurrentGroup(appState.presentation);
  saveAppState();
  render();
});

gradingForm.addEventListener("submit", event => {
  event.preventDefault();
  gradingError.textContent = "";
  const entries = [...gradingList.querySelectorAll(".grade-row")].map(row => ({
    student: row.dataset.student,
    grade: row.querySelector(".grade-input").value,
    absent: row.querySelector(".absent-input").checked
  }));
  try {
    appState.presentation = PresentationLogic.saveGrades(appState.presentation, entries);
    saveAppState();
    render();
  } catch (error) {
    gradingError.textContent = error.message;
  }
});

downloadButton.addEventListener("click", () => {
  try {
    const rows = PresentationLogic.buildExportRows(appState.presentation);
    PresentationExport.download(XLSX, rows, appState.presentation.maxGrade, "notas-apresentacoes.xlsx");
  } catch (error) {
    completionSummary.textContent = `Não foi possível gerar a planilha: ${error.message}`;
  }
});

resetButton.addEventListener("click", async () => {
  const confirmed = await AppDialog.confirm({
    title: "Reiniciar as apresentações?",
    message: "A ordem sorteada e todas as notas registradas serão apagadas. Os grupos serão preservados.",
    confirmText: "Reiniciar",
    variant: "danger"
  });
  if (!confirmed) return;
  delete appState.presentation;
  saveAppState();
  restoreNotice = "";
  render();
});

if (hasCompleteGroups(appState) && appState.presentation && !PresentationLogic.isValidSession(appState.presentation, appState.groups)) {
  delete appState.presentation;
  saveAppState();
  restoreNotice = "A sessão anterior estava inválida e foi reiniciada. Os grupos foram preservados.";
}

render();
