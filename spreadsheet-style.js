(function (global) {
  "use strict";

  const COLORS = {
    primary: "276B5A",
    text: "20302C",
    muted: "687772",
    border: "DCE1DA",
    stripe: "F1F5F2",
    white: "FFFFFF",
    absentFill: "FBECE8",
    absentText: "A13F3A"
  };

  function border(color = COLORS.border) {
    return {
      top: { style: "thin", color: { rgb: color } },
      bottom: { style: "thin", color: { rgb: color } },
      left: { style: "thin", color: { rgb: color } },
      right: { style: "thin", color: { rgb: color } }
    };
  }

  function createStyledSheet(xlsxApi, options) {
    const { title, subtitle, headers, dataRows, columnWidths, numericColumns = [], wrapColumns = [] } = options;
    const values = [
      [title],
      [subtitle],
      [],
      headers,
      ...dataRows
    ];
    const worksheet = xlsxApi.utils.aoa_to_sheet(values);
    const lastColumn = xlsxApi.utils.encode_col(headers.length - 1);
    const lastRow = values.length;
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
    ];
    worksheet["!cols"] = columnWidths.map(wch => ({ wch }));
    worksheet["!rows"] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 8 }, { hpt: 24 }];
    worksheet["!autofilter"] = { ref: `A4:${lastColumn}${lastRow}` };

    worksheet.A1.s = {
      font: { name: "Arial", size: 16, bold: true, color: { rgb: COLORS.text } },
      alignment: { vertical: "center" }
    };
    worksheet.A2.s = {
      font: { name: "Arial", size: 10, italic: true, color: { rgb: COLORS.muted } },
      alignment: { vertical: "center" }
    };

    headers.forEach((_, columnIndex) => {
      const cell = worksheet[`${xlsxApi.utils.encode_col(columnIndex)}4`];
      cell.s = {
        fill: { patternType: "solid", fgColor: { rgb: COLORS.primary } },
        font: { name: "Arial", size: 10, bold: true, color: { rgb: COLORS.white } },
        alignment: { horizontal: "center", vertical: "center" },
        border: border("FFFFFF")
      };
    });

    dataRows.forEach((row, rowIndex) => {
      row.forEach((_, columnIndex) => {
        const cell = worksheet[`${xlsxApi.utils.encode_col(columnIndex)}${rowIndex + 5}`];
        if (!cell) return;
        cell.s = {
          fill: { patternType: "solid", fgColor: { rgb: rowIndex % 2 ? COLORS.stripe : COLORS.white } },
          font: { name: "Arial", size: 10, color: { rgb: COLORS.text } },
          alignment: { vertical: "center", horizontal: typeof cell.v === "number" ? "right" : "left" },
          border: border()
        };
        if (numericColumns.includes(columnIndex)) cell.z = "0.00";
        if (wrapColumns.includes(columnIndex)) cell.s.alignment.wrapText = true;
      });
      worksheet["!rows"][rowIndex + 4] = { hpt: wrapColumns.length ? 34 : 21 };
    });

    return worksheet;
  }

  function styleAbsentRow(xlsxApi, worksheet, rowNumber, columnCount) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cell = worksheet[`${xlsxApi.utils.encode_col(columnIndex)}${rowNumber}`];
      if (!cell) continue;
      cell.s = {
        ...cell.s,
        fill: { patternType: "solid", fgColor: { rgb: COLORS.absentFill } },
        font: { ...cell.s.font, color: { rgb: COLORS.absentText } }
      };
    }
  }

  const api = { COLORS, createStyledSheet, styleAbsentRow };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SpreadsheetStyle = api;
})(typeof window !== "undefined" ? window : globalThis);
