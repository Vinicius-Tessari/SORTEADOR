(function (global) {
  "use strict";

  function decodeHtml(value) {
    const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
    return String(value)
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
  }

  function textFromHtml(value) {
    return decodeHtml(
      String(value)
        .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    ).replace(/\s+/g, " ").trim();
  }

  function extractListItems(fragment) {
    const members = [];
    const itemPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = itemPattern.exec(fragment))) {
      const name = textFromHtml(match[1]).replace(/^\d+[.)-]?\s*/, "").trim();
      if (name) members.push(name);
    }
    return members;
  }

  function extractEmbeddedGroups(html) {
    const match = String(html).match(/<script\b[^>]*\bid=["']groupsData["'][^>]*>([\s\S]*?)<\/script>/i);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1].trim());
      return Array.isArray(parsed) ? parsed : parsed.groups;
    } catch (_) {
      throw new Error("Os dados de grupos incorporados ao HTML são inválidos.");
    }
  }

  function extractGroupCards(html) {
    const groups = [];
    const cardPattern = /<article\b[^>]*class=["'][^"']*\bfinal-group-card\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi;
    let match;
    while ((match = cardPattern.exec(html))) {
      const members = extractListItems(match[1]);
      if (members.length) groups.push(members);
    }
    return groups;
  }

  function extractHeadingGroups(html) {
    const headings = [];
    const headingPattern = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
    let match;
    while ((match = headingPattern.exec(html))) {
      if (/^grupo\s*\d+$/i.test(textFromHtml(match[1]))) {
        headings.push({ start: match.index, contentEnd: headingPattern.lastIndex });
      }
    }
    return headings.map((heading, index) => {
      const end = headings[index + 1]?.start ?? html.length;
      return extractListItems(html.slice(heading.contentEnd, end));
    }).filter(group => group.length);
  }

  function validateGroups(groups) {
    if (!Array.isArray(groups) || groups.length === 0) {
      throw new Error("Nenhum grupo com alunos foi encontrado no arquivo.");
    }
    const normalizedGroups = groups.map((group, index) => {
      if (!Array.isArray(group) || group.length === 0) {
        throw new Error(`O Grupo ${index + 1} está vazio.`);
      }
      return group.map(member => {
        const name = textFromHtml(member);
        if (!name) throw new Error(`Há um nome vazio no Grupo ${index + 1}.`);
        return name;
      });
    });

    const seen = new Set();
    normalizedGroups.flat().forEach(name => {
      const key = name.toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
      if (seen.has(key)) throw new Error(`Aluno duplicado encontrado: ${name}.`);
      seen.add(key);
    });
    return normalizedGroups;
  }

  function normalizeHeader(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function isGroupHeader(value) {
    return ["grupo", "numero do grupo", "n do grupo"].includes(normalizeHeader(value));
  }

  function isStudentHeader(value) {
    return ["aluno", "nome do aluno", "estudante", "nome do estudante"].includes(normalizeHeader(value));
  }

  function parseTableRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("A tabela está vazia.");
    }
    let headerRowIndex = -1;
    let groupColumnIndex = -1;
    let studentColumnIndex = -1;

    rows.some((row, rowIndex) => {
      const cells = Array.isArray(row) ? row : [];
      const groupIndex = cells.findIndex(isGroupHeader);
      const studentIndex = cells.findIndex(isStudentHeader);
      if (groupIndex >= 0 && studentIndex >= 0) {
        headerRowIndex = rowIndex;
        groupColumnIndex = groupIndex;
        studentColumnIndex = studentIndex;
        return true;
      }
      return false;
    });

    if (headerRowIndex < 0) {
      throw new Error('Não foram encontradas as colunas "Grupo" e "Aluno".');
    }

    const groupsByLabel = new Map();
    rows.slice(headerRowIndex + 1).forEach((rawRow, offset) => {
      const row = Array.isArray(rawRow) ? rawRow : [];
      const lineNumber = headerRowIndex + offset + 2;
      const groupLabel = String(row[groupColumnIndex] ?? "").trim();
      const student = String(row[studentColumnIndex] ?? "").replace(/\s+/g, " ").trim();
      if (!groupLabel && !student) return;
      if (!groupLabel) throw new Error(`Grupo não informado na linha ${lineNumber}.`);
      if (!student) throw new Error(`Aluno não informado na linha ${lineNumber}.`);
      const key = normalizeHeader(groupLabel);
      if (!groupsByLabel.has(key)) groupsByLabel.set(key, []);
      groupsByLabel.get(key).push(student);
    });

    return validateGroups([...groupsByLabel.values()]);
  }

  function parseDelimitedRows(text, delimiter) {
    const rows = [[]];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === delimiter && !quoted) {
        rows[rows.length - 1].push(cell);
        cell = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        rows[rows.length - 1].push(cell);
        cell = "";
        rows.push([]);
      } else {
        cell += character;
      }
    }
    rows[rows.length - 1].push(cell);
    return rows;
  }

  function parseSectionedText(text) {
    const groups = [];
    let currentGroup = null;
    String(text).split(/\r?\n/).forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;
      if (/^grupo\s*(?:n[º°o.]?\s*)?[^\s]+/i.test(line)) {
        currentGroup = [];
        groups.push(currentGroup);
        return;
      }
      if (!currentGroup) return;
      const name = line.replace(/^(?:[-*•]|\d+[.)-]?)\s*/, "").trim();
      if (name) currentGroup.push(name);
    });
    return validateGroups(groups);
  }

  function parseText(text) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    if (!source.trim()) throw new Error("O arquivo de texto está vazio.");
    for (const delimiter of [";", ",", "\t"]) {
      try {
        return parseTableRows(parseDelimitedRows(source, delimiter));
      } catch (_) {}
    }
    return parseSectionedText(source);
  }

  function parseWorkbook(xlsxApi, data) {
    if (!xlsxApi || typeof xlsxApi.read !== "function" || !xlsxApi.utils) {
      throw new Error("Leitor de planilhas indisponível.");
    }
    let workbook;
    try {
      const options = typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer ? { type: "array" } : {};
      workbook = xlsxApi.read(data, options);
    } catch (_) {
      throw new Error("Não foi possível abrir a planilha.");
    }
    const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];
    if (!firstSheetName) throw new Error("A planilha não possui abas.");
    const rows = xlsxApi.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false
    });
    return parseTableRows(rows);
  }

  function parseHtml(html) {
    const source = String(html || "");
    if (!source.trim()) throw new Error("O arquivo HTML está vazio.");
    const embedded = extractEmbeddedGroups(source);
    if (embedded) return validateGroups(embedded);
    const cards = extractGroupCards(source);
    if (cards.length) return validateGroups(cards);
    return validateGroups(extractHeadingGroups(source));
  }

  function createAppState(groups, importedFrom = "arquivo HTML") {
    const validated = validateGroups(groups);
    return {
      groupCount: validated.length,
      studentCount: validated.flat().length,
      capacities: validated.map(group => group.length),
      groups: validated,
      createdAt: new Date().toISOString(),
      importedFrom: String(importedFrom || "arquivo HTML")
    };
  }

  const api = { parseHtml, parseTableRows, parseText, parseWorkbook, createAppState };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.GroupImportLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
