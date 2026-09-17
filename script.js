"use strict";

const STORAGE_KEY = "sorteadorGruposState";

const setupScreen = document.getElementById("setupScreen");
const drawScreen = document.getElementById("drawScreen");
const setupForm = document.getElementById("setupForm");
const studentForm = document.getElementById("studentForm");
const groupCountInput = document.getElementById("groupCount");
const studentCountInput = document.getElementById("studentCount");
const studentNameInput = document.getElementById("studentName");
const setupError = document.getElementById("setupError");
const studentError = document.getElementById("studentError");
const groupsGrid = document.getElementById("groupsGrid");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const remainingText = document.getElementById("remainingText");
const animatedName = document.getElementById("animatedName");
const animatedGroup = document.getElementById("animatedGroup");
const drawButton = document.getElementById("drawButton");
const resetButton = document.getElementById("resetButton");
const completionPanel = document.getElementById("completionPanel");
const exportGroupsButton = document.getElementById("exportGroupsButton");
const importGroupsButton = document.getElementById("importGroupsButton");
const importGroupsCurrentButton = document.getElementById("importGroupsCurrentButton");
const groupsHtmlFile = document.getElementById("groupsHtmlFile");
const importError = document.getElementById("importError");

let state = null;
let isDrawing = false;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      parsed &&
      Number.isInteger(parsed.groupCount) &&
      Number.isInteger(parsed.studentCount) &&
      Array.isArray(parsed.capacities) &&
      Array.isArray(parsed.groups)
    ) {
      state = parsed;
      return true;
    }
  } catch (_) {}
  return false;
}

function createState(groupCount, studentCount) {
  const capacities = GroupLogic.createBalancedCapacities(groupCount, studentCount);
  return {
    groupCount,
    studentCount,
    capacities,
    groups: Array.from({ length: groupCount }, () => []),
    createdAt: new Date().toISOString()
  };
}

function showDrawScreen() {
  setupScreen.classList.add("hidden");
  drawScreen.classList.remove("hidden");
  render();
  setTimeout(() => studentNameInput.focus(), 100);
}

function render() {
  const allocated = GroupLogic.totalAllocated(state.groups);
  const remaining = state.studentCount - allocated;
  const percent = Math.round((allocated / state.studentCount) * 100);

  progressText.textContent = `${allocated} de ${state.studentCount} alunos`;
  progressFill.style.width = `${percent}%`;
  remainingText.textContent = remaining === 1 ? "1 aluno restante" : `${remaining} alunos restantes`;

  groupsGrid.innerHTML = "";

  state.groups.forEach((members, index) => {
    const groupCard = document.createElement("article");
    groupCard.className = "group-card";
    groupCard.dataset.groupIndex = String(index);

    const isComplete = members.length === state.capacities[index];
    if (isComplete) groupCard.classList.add("group-complete");

    const memberItems = members.length
      ? members.map((member, memberIndex) =>
          `<li style="--delay:${memberIndex * 40}ms"><span>${memberIndex + 1}</span><strong>${escapeHtml(member)}</strong></li>`
        ).join("")
      : `<li class="empty-member">Aguardando sorteio...</li>`;

    groupCard.innerHTML = `
      <div class="group-card-header">
        <div>
          <span class="group-kicker">GRUPO</span>
          <h3>${index + 1}</h3>
        </div>
        <span class="capacity-badge">${members.length}/${state.capacities[index]}</span>
      </div>
      <ul class="member-list">${memberItems}</ul>
    `;

    groupsGrid.appendChild(groupCard);
  });

  const complete = GroupLogic.allGroupsComplete(state.groups, state.capacities);
  completionPanel.classList.toggle("hidden", !complete);
  studentForm.classList.toggle("disabled-form", complete);
  studentNameInput.disabled = complete;
  drawButton.disabled = complete;

  if (complete) {
    remainingText.textContent = "Sorteio concluído";
    animatedName.textContent = "Turma completa!";
    animatedGroup.textContent = "✓";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStudentError(message = "") {
  studentError.textContent = message;
}

function setSetupError(message = "") {
  setupError.textContent = message;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateDraw(name, destinationIndex) {
  isDrawing = true;
  drawButton.disabled = true;
  studentNameInput.disabled = true;
  setStudentError("");

  const available = state.groups
    .map((members, index) => state.capacities[index] > members.length ? index : null)
    .filter(index => index !== null);

  animatedName.textContent = name;
  animatedName.classList.add("name-shuffling");
  animatedGroup.classList.add("group-shuffling");

  const iterations = Math.max(14, available.length * 5);
  for (let i = 0; i < iterations; i++) {
    const randomIndex = available[Math.floor(Math.random() * available.length)];
    animatedGroup.textContent = `Grupo ${randomIndex + 1}`;
    groupsGrid.querySelectorAll(".group-card").forEach(card => card.classList.remove("group-preview"));
    const preview = groupsGrid.querySelector(`[data-group-index="${randomIndex}"]`);
    if (preview) preview.classList.add("group-preview");
    await wait(55 + i * 4);
  }

  groupsGrid.querySelectorAll(".group-card").forEach(card => card.classList.remove("group-preview"));
  animatedGroup.textContent = `Grupo ${destinationIndex + 1}`;
  animatedName.classList.remove("name-shuffling");
  animatedGroup.classList.remove("group-shuffling");
  animatedGroup.classList.add("group-result");

  const destinationCard = groupsGrid.querySelector(`[data-group-index="${destinationIndex}"]`);
  if (destinationCard) {
    destinationCard.classList.add("group-winner");
    await wait(700);
    destinationCard.classList.remove("group-winner");
  } else {
    await wait(700);
  }

  animatedGroup.classList.remove("group-result");
  isDrawing = false;
}

setupForm.addEventListener("submit", event => {
  event.preventDefault();
  setSetupError("");

  try {
    const groupCount = Number(groupCountInput.value);
    const studentCount = Number(studentCountInput.value);

    state = createState(groupCount, studentCount);
    saveState();
    showDrawScreen();
  } catch (error) {
    setSetupError(error.message);
  }
});

studentForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (isDrawing) return;

  const name = studentNameInput.value.trim().replace(/\s+/g, " ");

  if (name.length < 3) {
    setStudentError("Digite o nome completo do aluno.");
    return;
  }

  if (GroupLogic.isDuplicateName(name, state.groups)) {
    setStudentError("Esse aluno já foi sorteado.");
    return;
  }

  if (GroupLogic.totalAllocated(state.groups) >= state.studentCount) {
    setStudentError("Todos os alunos já foram sorteados.");
    return;
  }

  const destinationIndex = GroupLogic.chooseAvailableGroup(state.groups, state.capacities);

  await animateDraw(name, destinationIndex);

  state.groups[destinationIndex].push(name);
  saveState();
  studentNameInput.value = "";
  render();

  if (!GroupLogic.allGroupsComplete(state.groups, state.capacities)) {
    studentNameInput.disabled = false;
    drawButton.disabled = false;
    studentNameInput.focus();
  } else {
    completionPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

resetButton.addEventListener("click", async () => {
  const confirmed = await AppDialog.confirm({
    title: "Reiniciar o sorteio?",
    message: "Os grupos e todos os alunos sorteados serão apagados.",
    confirmText: "Reiniciar",
    variant: "danger"
  });
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

exportGroupsButton.addEventListener("click", () => {
  try {
    GroupExport.download(XLSX, state.groups, "grupos-sorteados.xlsx");
  } catch (error) {
    setStudentError(`Não foi possível exportar os grupos: ${error.message}`);
  }
});

function openGroupImporter() {
  importError.textContent = "";
  groupsHtmlFile.value = "";
  groupsHtmlFile.click();
}

importGroupsButton.addEventListener("click", openGroupImporter);
importGroupsCurrentButton.addEventListener("click", openGroupImporter);

groupsHtmlFile.addEventListener("change", async () => {
  const file = groupsHtmlFile.files && groupsHtmlFile.files[0];
  if (!file) return;
  importGroupsButton.disabled = true;
  importGroupsCurrentButton.disabled = true;
  importError.textContent = "";
  try {
    const extension = file.name.split(".").pop().toLocaleLowerCase("pt-BR");
    let groups;
    if (["html", "htm"].includes(extension)) {
      groups = GroupImportLogic.parseHtml(await file.text());
    } else if (extension === "txt") {
      groups = GroupImportLogic.parseText(await file.text());
    } else if (["xlsx", "xls", "csv"].includes(extension)) {
      groups = GroupImportLogic.parseWorkbook(XLSX, await file.arrayBuffer());
    } else {
      throw new Error("Formato não aceito. Use HTML, XLSX, XLS, CSV ou TXT.");
    }
    state = GroupImportLogic.createAppState(groups, file.name);
    saveState();
    window.location.href = "apresentacoes.html";
  } catch (error) {
    importError.textContent = error.message;
    if (setupScreen.classList.contains("hidden")) {
      await AppDialog.notify({
        title: "Não foi possível importar",
        message: error.message,
        variant: "danger"
      });
    }
  } finally {
    importGroupsButton.disabled = false;
    importGroupsCurrentButton.disabled = false;
  }
});

if (loadState()) {
  showDrawScreen();
}
