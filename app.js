const TEMPLATE_URL = "assets/cotizacion-hym.pdf";
const PREVIEW_TEMPLATE_URL = "assets/cotizacion-preview.png";
const HISTORY_KEY = "hym_quote_history";
const TICKET_HISTORY_KEY = "hym_ticket_history";
const MAX_ITEMS_IN_TEMPLATE = 8;
const MAX_ITEM_IMAGE_SIZE = 700;
const PDF_PAGE_WIDTH = 595.5;
const PDF_PAGE_HEIGHT = 842.25;
const TICKET_WIDTH = 900;
const TICKET_HEIGHT = 1280;

const state = {
  currentPdfUrl: "",
  currentPdfBytes: null,
  currentQuote: null,
  currentTicket: null,
  currentTicketBlob: null,
  currentTicketUrl: "",
  items: []
};

const views = {
  home: document.getElementById("homeView"),
  form: document.getElementById("formView"),
  preview: document.getElementById("previewView"),
  history: document.getElementById("historyView"),
  ticketForm: document.getElementById("ticketFormView"),
  ticketPreview: document.getElementById("ticketPreviewView"),
  ticketHistory: document.getElementById("ticketHistoryView")
};

const form = document.getElementById("quoteForm");
const quoteDate = document.getElementById("quoteDate");
const clientName = document.getElementById("clientName");
const commercialConditions = document.getElementById("commercialConditions");
const itemsList = document.getElementById("itemsList");
const grandTotal = document.getElementById("grandTotal");
const continueButton = document.getElementById("continueButton");
const pdfPreviewCanvas = document.getElementById("pdfPreviewCanvas");
const pdfPreviewPages = document.getElementById("pdfPreviewPages");
const historyList = document.getElementById("historyList");
const shareButton = document.getElementById("shareButton");
const ticketForm = document.getElementById("ticketForm");
const ticketDate = document.getElementById("ticketDate");
const ticketClientName = document.getElementById("ticketClientName");
const ticketType = document.getElementById("ticketType");
const ticketServiceDescription = document.getElementById("ticketServiceDescription");
const ticketDetails = document.getElementById("ticketDetails");
const ticketTotalAmount = document.getElementById("ticketTotalAmount");
const ticketTotalAmountLabel = document.getElementById("ticketTotalAmountLabel");
const ticketPaidAmount = document.getElementById("ticketPaidAmount");
const ticketPendingAmount = document.getElementById("ticketPendingAmount");
const ticketContinueButton = document.getElementById("ticketContinueButton");
const ticketPreviewCanvas = document.getElementById("ticketPreviewCanvas");
const ticketHistoryList = document.getElementById("ticketHistoryList");

function showView(name) {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[name].classList.add("active");
}

function todayValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function quoteFileName(quote) {
  const safeClient = quote.clientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .toLowerCase();
  return `cotizacion-hym-${safeClient || "cliente"}-${quote.date}.pdf`;
}

function toMoney(value) {
  return Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatCurrency(value) {
  return `S/ ${toMoney(value)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function readTicketHistory() {
  try {
    return JSON.parse(localStorage.getItem(TICKET_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeTicketHistory(history) {
  localStorage.setItem(TICKET_HISTORY_KEY, JSON.stringify(history.slice(0, 80)));
}

function createItem(description = "", quantity = "", unitValue = "", imageDataUrl = "") {
  state.items.push({
    id: crypto.randomUUID(),
    description,
    quantity,
    unitValue,
    imageDataUrl
  });
  renderItems();
}

function lineTotal(item) {
  return Number(item.quantity || 0) * Number(item.unitValue || 0);
}

function grandTotalValue() {
  return state.items.reduce((total, item) => total + lineTotal(item), 0);
}

function validItems() {
  return state.items.filter(
    (item) =>
      item.description.trim() &&
      Number(item.quantity) > 0 &&
      Number(item.unitValue) >= 0
  );
}

function validateForm() {
  const complete =
    quoteDate.value &&
    clientName.value.trim() &&
    validItems().length === state.items.length &&
    state.items.length > 0 &&
    state.items.length <= MAX_ITEMS_IN_TEMPLATE;
  continueButton.disabled = !complete;
  grandTotal.textContent = formatCurrency(grandTotalValue());
}

function renderItems() {
  itemsList.innerHTML = "";
  state.items.forEach((item, index) => {
    const imagePreview = item.imageDataUrl
      ? `<img class="item-image-preview" src="${item.imageDataUrl}" alt="Imagen del ítem ${index + 1}">`
      : `<span class="item-image-empty">Sin imagen</span>`;
    const wrapper = document.createElement("article");
    wrapper.className = "quote-item";
    wrapper.dataset.id = item.id;
    wrapper.innerHTML = `
      <div class="item-row-title">
        <strong>Ítem ${index + 1}</strong>
        <button class="small-button" type="button" data-remove="${item.id}">Quitar</button>
      </div>
      <div class="item-grid">
        <label>
          <span>Descripción del servicio o producto</span>
          <textarea data-field="description" required>${escapeHtml(item.description)}</textarea>
        </label>
        <label>
          <span>Cantidad</span>
          <input data-field="quantity" type="number" min="1" step="1" value="${escapeHtml(item.quantity)}" required>
        </label>
        <label>
          <span>Valor por unidad</span>
          <input data-field="unitValue" type="number" min="0" step="0.01" value="${escapeHtml(item.unitValue)}" required>
        </label>
      </div>
      <label>
        <span>Imagen del producto o servicio (opcional)</span>
        <input data-image-input type="file" accept="image/*">
      </label>
      <div class="item-image-box">${imagePreview}</div>
      <div class="line-total">Valor total: <span data-line-total>${formatCurrency(lineTotal(item))}</span></div>
    `;
    itemsList.appendChild(wrapper);
  });
  validateForm();
}

function collectQuote() {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    date: quoteDate.value,
    clientName: clientName.value.trim(),
    commercialConditions: commercialConditions.value.trim(),
    items: state.items.map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unitValue: Number(item.unitValue),
      total: lineTotal(item),
      imageDataUrl: item.imageDataUrl || ""
    })),
    total: grandTotalValue()
  };
}

function wrapText(text, font, size, maxWidth) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
      line = testLine;
      return;
    }

    if (line) lines.push(line);
    line = word;

    while (font.widthOfTextAtSize(line, size) > maxWidth && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(`${line.slice(0, cut)}-`, size) > maxWidth) {
        cut -= 1;
      }
      lines.push(`${line.slice(0, cut)}-`);
      line = line.slice(cut);
    }
  });

  if (line) lines.push(line);
  return lines;
}

function wrapTextPreservingBreaks(text, font, size, maxWidth) {
  return String(text)
    .split(/\r?\n/)
    .flatMap((paragraph) => {
      const trimmed = paragraph.trim();
      return trimmed ? wrapText(trimmed, font, size, maxWidth) : [""];
    });
}

function drawText(page, text, options) {
  page.drawText(String(text), {
    x: options.x,
    y: options.y,
    size: options.size,
    font: options.font,
    color: PDFLib.rgb(0, 0, 0)
  });
}

function drawRight(page, text, x, y, width, size, font) {
  const value = String(text);
  const textWidth = font.widthOfTextAtSize(value, size);
  drawText(page, value, { x: x + width - textWidth, y, size, font });
}

function drawCenter(page, text, x, y, width, size, font) {
  const value = String(text);
  const textWidth = font.widthOfTextAtSize(value, size);
  drawText(page, value, { x: x + (width - textWidth) / 2, y, size, font });
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const ratio = Math.min(1, MAX_ITEM_IMAGE_SIZE / image.width, MAX_ITEM_IMAGE_SIZE / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBytes(dataUrl) {
  const [meta, data] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] || "";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return { bytes, mime };
}

async function embedItemImage(pdfDoc, dataUrl) {
  const { bytes, mime } = dataUrlToBytes(dataUrl);
  if (mime === "image/png") return pdfDoc.embedPng(bytes);
  return pdfDoc.embedJpg(bytes);
}

function fitInside(width, height, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: width * ratio,
    height: height * ratio
  };
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawPreviewText(context, text, x, y, size, bold = false) {
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  const scaleY = context.canvas.height / PDF_PAGE_HEIGHT;
  context.font = `${bold ? "700 " : ""}${size * scaleY}px Arial`;
  context.fillStyle = "#000000";
  context.textBaseline = "alphabetic";
  context.fillText(String(text), x * scaleX, (PDF_PAGE_HEIGHT - y) * scaleY);
}

function drawPreviewRight(context, text, x, y, width, size, bold = false) {
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  const value = String(text);
  context.font = `${bold ? "700 " : ""}${size * (context.canvas.height / PDF_PAGE_HEIGHT)}px Arial`;
  const textWidth = context.measureText(value).width;
  drawPreviewText(context, value, x + width - textWidth / scaleX, y, size, bold);
}

function drawPreviewCenter(context, text, x, y, width, size, bold = false) {
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  const value = String(text);
  context.font = `${bold ? "700 " : ""}${size * (context.canvas.height / PDF_PAGE_HEIGHT)}px Arial`;
  const textWidth = context.measureText(value).width;
  drawPreviewText(context, value, x + (width - textWidth / scaleX) / 2, y, size, bold);
}

function wrapCanvasText(context, text, size, maxWidth) {
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  const scaleY = context.canvas.height / PDF_PAGE_HEIGHT;
  context.font = `${size * scaleY}px Arial`;
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth * scaleX) {
      line = testLine;
      return;
    }
    if (line) lines.push(line);
    line = word;

    while (context.measureText(line).width > maxWidth * scaleX && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && context.measureText(`${line.slice(0, cut)}-`).width > maxWidth * scaleX) {
        cut -= 1;
      }
      lines.push(`${line.slice(0, cut)}-`);
      line = line.slice(cut);
    }
  });

  if (line) lines.push(line);
  return lines;
}

function createItemTablePages(items, wrapDescription) {
  const availableHeight = 192;
  const fontSize = 9;
  const lineHeight = 11;
  const pages = [[]];
  let usedHeight = 0;

  items.forEach((item, itemIndex) => {
    const allLines = wrapDescription(item.description, fontSize);
    let lineOffset = 0;
    let firstSegment = true;

    while (lineOffset < allLines.length) {
      let remainingHeight = availableHeight - usedHeight;
      let maxLines = Math.floor((remainingHeight - 6) / lineHeight);

      if (remainingHeight < 24 || maxLines < 1) {
        pages.push([]);
        usedHeight = 0;
        remainingHeight = availableHeight;
        maxLines = Math.floor((remainingHeight - 6) / lineHeight);
      }

      const lines = allLines.slice(lineOffset, lineOffset + maxLines);
      const height = Math.max(24, lines.length * lineHeight + 6);

      if (height > remainingHeight && pages[pages.length - 1].length) {
        pages.push([]);
        usedHeight = 0;
        continue;
      }

      pages[pages.length - 1].push({
        item,
        itemIndex,
        lines,
        fontSize,
        lineHeight,
        height,
        firstSegment
      });
      usedHeight += height;
      lineOffset += lines.length;
      firstSegment = false;
    }
  });

  return pages.map((pageRows) => {
    let rowY = 450;
    return pageRows.map((row) => {
      const positionedRow = { ...row, rowY };
      rowY -= row.height;
      return positionedRow;
    });
  });
}

function wrapCanvasTextPreservingBreaks(context, text, size, maxWidth) {
  return String(text)
    .split(/\r?\n/)
    .flatMap((paragraph) => {
      const trimmed = paragraph.trim();
      return trimmed ? wrapCanvasText(context, trimmed, size, maxWidth) : [""];
    });
}

async function renderQuotePreview(quote) {
  const template = await loadImage(PREVIEW_TEMPLATE_URL);
  const previewItems = quote.items.slice(0, MAX_ITEMS_IN_TEMPLATE);
  const measurementCanvas = document.createElement("canvas");
  measurementCanvas.width = template.naturalWidth;
  measurementCanvas.height = template.naturalHeight;
  const measurementContext = measurementCanvas.getContext("2d");
  const pageLayouts = createItemTablePages(previewItems, (description, size) =>
    wrapCanvasText(measurementContext, description, size, 190)
  );

  pdfPreviewPages.innerHTML = "";
  for (const [pageIndex, pageRows] of pageLayouts.entries()) {
    const canvas = pageIndex === 0 ? pdfPreviewCanvas : document.createElement("canvas");
    canvas.className = "pdf-preview-page";
    canvas.width = template.naturalWidth;
    canvas.height = template.naturalHeight;
    pdfPreviewPages.appendChild(canvas);
    const context = canvas.getContext("2d");
    context.drawImage(template, 0, 0);

    drawPreviewText(context, formatDisplayDate(quote.date), 60, 665, 11);
    drawPreviewText(context, quote.clientName, 80, 621, 12, true);

    for (const row of pageRows) {
      const { item, itemIndex, lines, fontSize, lineHeight, rowY, firstSegment } = row;
      drawPreviewText(context, String(itemIndex + 1), 46, rowY, 10, true);

      if (firstSegment && item.imageDataUrl) {
        try {
          const image = await loadImage(item.imageDataUrl);
          const size = fitInside(image.naturalWidth, image.naturalHeight, 70, 44);
          const imageX = 115 - size.width / 2;
          const imageY = rowY - 6 - size.height / 2;
          const scaleX = canvas.width / PDF_PAGE_WIDTH;
          const scaleY = canvas.height / PDF_PAGE_HEIGHT;
          context.drawImage(
            image,
            imageX * scaleX,
            (PDF_PAGE_HEIGHT - imageY - size.height) * scaleY,
            size.width * scaleX,
            size.height * scaleY
          );
        } catch {
          drawPreviewText(context, "Imagen no disponible", 76, rowY, 7);
        }
      }

      lines.forEach((line, lineIndex) => {
        drawPreviewText(context, line, 164, rowY - lineIndex * lineHeight, fontSize);
      });
      if (firstSegment) {
        drawPreviewRight(context, item.quantity, 360, rowY, 45, 10);
        drawPreviewRight(context, toMoney(item.unitValue), 420, rowY, 56, 10);
        drawPreviewRight(context, toMoney(item.total), 493, rowY, 65, 10, true);
      }
    }

    const isLastPage = pageIndex === pageLayouts.length - 1;
    if (isLastPage) drawPreviewCenter(context, toMoney(quote.total), 493, 233, 65, 13, true);

    if (isLastPage && quote.commercialConditions) {
      wrapCanvasTextPreservingBreaks(context, quote.commercialConditions, 9, 500).slice(0, 8).forEach((line, lineIndex) => {
        if (line) drawPreviewText(context, line, 38, 156 - lineIndex * 12, 9);
      });
    }
  }
}

async function generatePdf(quote) {
  const templateBytes = await fetch(TEMPLATE_URL).then((response) => response.arrayBuffer());
  const templateDoc = await PDFLib.PDFDocument.load(templateBytes);
  const pdfDoc = await PDFLib.PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

  const pdfItems = quote.items.slice(0, MAX_ITEMS_IN_TEMPLATE);
  const pageLayouts = createItemTablePages(pdfItems, (description, size) =>
    wrapText(description, regularFont, size, 190)
  );

  const copiedPages = await pdfDoc.copyPages(templateDoc, pageLayouts.map(() => 0));
  for (const [pageIndex, page] of copiedPages.entries()) {
    pdfDoc.addPage(page);
    drawText(page, formatDisplayDate(quote.date), { x: 60, y: 665, size: 11, font: regularFont });
    drawText(page, quote.clientName, { x: 80, y: 621, size: 12, font: boldFont });

    for (const row of pageLayouts[pageIndex]) {
      const { item, itemIndex, lines, fontSize, lineHeight, rowY, firstSegment } = row;
      drawText(page, String(itemIndex + 1), { x: 46, y: rowY, size: 10, font: boldFont });
      if (firstSegment && item.imageDataUrl) {
        try {
          const image = await embedItemImage(pdfDoc, item.imageDataUrl);
          const size = fitInside(image.width, image.height, 70, 44);
          page.drawImage(image, {
            x: 115 - size.width / 2,
            y: rowY - 6 - size.height / 2,
            width: size.width,
            height: size.height
          });
        } catch {
          drawText(page, "Imagen no disponible", { x: 76, y: rowY, size: 7, font: regularFont });
        }
      }
      lines.forEach((line, lineIndex) => {
        drawText(page, line, {
          x: 164,
          y: rowY - lineIndex * lineHeight,
          size: fontSize,
          font: regularFont
        });
      });
      if (firstSegment) {
        drawRight(page, item.quantity, 360, rowY, 45, 10, regularFont);
        drawRight(page, toMoney(item.unitValue), 420, rowY, 56, 10, regularFont);
        drawRight(page, toMoney(item.total), 493, rowY, 65, 10, boldFont);
      }
    }

    const isLastPage = pageIndex === pageLayouts.length - 1;
    if (isLastPage) drawCenter(page, toMoney(quote.total), 493, 233, 65, 13, boldFont);

    if (isLastPage && quote.commercialConditions) {
      wrapTextPreservingBreaks(quote.commercialConditions, regularFont, 9, 500).slice(0, 8).forEach((line, lineIndex) => {
        if (!line) return;
        drawText(page, line, {
          x: 38,
          y: 156 - lineIndex * 12,
          size: 9,
          font: regularFont
        });
      });
    }
  }
  return pdfDoc.save();
}

function setPdfPreview(bytes, quote) {
  if (state.currentPdfUrl) URL.revokeObjectURL(state.currentPdfUrl);
  const blob = new Blob([bytes], { type: "application/pdf" });
  state.currentPdfUrl = URL.createObjectURL(blob);
  state.currentPdfBytes = bytes;
  state.currentQuote = quote;
  renderQuotePreview(quote);
}

function saveQuoteToHistory(quote) {
  const history = readHistory().filter((entry) => entry.id !== quote.id);
  history.unshift({
    id: quote.id,
    date: quote.date,
    clientName: quote.clientName,
    commercialConditions: quote.commercialConditions || "",
    total: quote.total,
    items: quote.items,
    createdAt: quote.createdAt
  });
  writeHistory(history);
}

function renderHistory() {
  const history = readHistory();
  historyList.innerHTML = "";

  if (!history.length) {
    historyList.innerHTML = `<div class="empty-state">Aún no hay cotizaciones guardadas.</div>`;
    return;
  }

  history.forEach((quote) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div class="quote-line">
        <strong>${escapeHtml(quote.clientName)}</strong>
        <span>${formatCurrency(quote.total)}</span>
      </div>
      <div>${formatDisplayDate(quote.date)}</div>
      <div class="history-actions">
        <button class="small-button" type="button" data-open-history="${quote.id}">Ver PDF</button>
        <button class="small-button" type="button" data-delete-history="${quote.id}">Borrar</button>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function deleteQuoteFromHistory(id) {
  writeHistory(readHistory().filter((quote) => quote.id !== id));
  renderHistory();
}

async function openHistoryQuote(id) {
  const quote = readHistory().find((entry) => entry.id === id);
  if (!quote) return;
  const bytes = await generatePdf(quote);
  setPdfPreview(bytes, quote);
  showView("preview");
}

function ticketFileName(ticket) {
  const safeClient = ticket.clientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .toLowerCase();
  return `ticket-hym-${safeClient || "cliente"}-${ticket.date}.jpg`;
}

function ticketPendingValue() {
  if (ticketType.value !== "advance") return 0;
  return Math.max(0, Number(ticketTotalAmount.value || 0) - Number(ticketPaidAmount.value || 0));
}

function validateTicketForm() {
  const isAdvance = ticketType.value === "advance";
  ticketTotalAmountLabel.style.display = isAdvance ? "grid" : "none";
  ticketPendingAmount.textContent = formatCurrency(ticketPendingValue());

  const complete =
    ticketDate.value &&
    ticketClientName.value.trim() &&
    ticketServiceDescription.value.trim() &&
    Number(ticketPaidAmount.value) > 0 &&
    (!isAdvance || Number(ticketTotalAmount.value) >= Number(ticketPaidAmount.value));

  ticketContinueButton.disabled = !complete;
}

function collectTicket() {
  const isAdvance = ticketType.value === "advance";
  const paidAmount = Number(ticketPaidAmount.value || 0);
  const totalAmount = isAdvance ? Number(ticketTotalAmount.value || 0) : paidAmount;
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    date: ticketDate.value,
    clientName: ticketClientName.value.trim(),
    type: ticketType.value,
    serviceDescription: ticketServiceDescription.value.trim(),
    details: ticketDetails.value.trim(),
    paidAmount,
    totalAmount,
    pendingAmount: isAdvance ? Math.max(0, totalAmount - paidAmount) : 0
  };
}

function ticketTypeLabel(ticket) {
  return ticket.type === "advance" ? "Adelanto" : "Pago total";
}

function drawTicketWrappedText(context, text, x, y, maxWidth, lineHeight, font) {
  context.font = font;
  context.fillStyle = "#000000";
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  lines.forEach((entry, index) => context.fillText(entry, x, y + index * lineHeight));
  return y + Math.max(1, lines.length) * lineHeight;
}

async function renderTicketPreview(ticket) {
  const context = ticketPreviewCanvas.getContext("2d");
  ticketPreviewCanvas.width = TICKET_WIDTH;
  ticketPreviewCanvas.height = TICKET_HEIGHT;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, TICKET_WIDTH, TICKET_HEIGHT);

  context.fillStyle = "#fedd58";
  context.fillRect(0, 0, TICKET_WIDTH, 170);
  context.fillRect(0, TICKET_HEIGHT - 42, TICKET_WIDTH, 42);
  context.strokeStyle = "#000000";
  context.lineWidth = 6;
  context.strokeRect(24, 24, TICKET_WIDTH - 48, TICKET_HEIGHT - 48);

  try {
    const logo = await loadImage("assets/logo-hym.png");
    context.drawImage(logo, 44, 28, 122, 122);
  } catch {
    context.strokeRect(44, 28, 122, 122);
  }

  context.fillStyle = "#000000";
  context.font = "700 46px Arial";
  context.fillText("HYM SERVICIOS GENERALES", 190, 78);
  context.font = "700 34px Arial";
  context.fillText("TICKET DE PAGO", 190, 126);

  context.textAlign = "center";
  context.font = "700 42px Arial";
  context.fillText(ticketTypeLabel(ticket).toUpperCase(), TICKET_WIDTH / 2, 235);
  context.textAlign = "left";

  const rows = [
    ["Fecha", formatDisplayDate(ticket.date)],
    ["Cliente", ticket.clientName],
    ["Servicio", ticket.serviceDescription],
    ["Detalles", ticket.details || "-"],
    ["Monto cobrado", formatCurrency(ticket.paidAmount)],
    ["Monto total", formatCurrency(ticket.totalAmount)]
  ];
  if (ticket.type === "advance") rows.push(["Saldo pendiente", formatCurrency(ticket.pendingAmount)]);

  let y = 310;
  rows.forEach(([label, value]) => {
    context.font = "700 28px Arial";
    context.fillStyle = "#000000";
    context.fillText(`${label}:`, 70, y);
    context.font = "28px Arial";
    y = drawTicketWrappedText(context, value, 310, y, 500, 36, "28px Arial") + 24;
  });

  context.fillStyle = "#fedd58";
  context.fillRect(70, y + 15, TICKET_WIDTH - 140, 110);
  context.strokeStyle = "#000000";
  context.lineWidth = 4;
  context.strokeRect(70, y + 15, TICKET_WIDTH - 140, 110);
  context.textAlign = "center";
  context.fillStyle = "#000000";
  context.font = "700 30px Arial";
  context.fillText(ticket.type === "advance" ? "SALDO PENDIENTE" : "PAGO COMPLETADO", TICKET_WIDTH / 2, y + 58);
  context.font = "700 42px Arial";
  context.fillText(ticket.type === "advance" ? formatCurrency(ticket.pendingAmount) : formatCurrency(ticket.paidAmount), TICKET_WIDTH / 2, y + 105);
  context.textAlign = "left";

  context.font = "24px Arial";
  context.fillText("Gracias por confiar en HYM Servicios Generales.", 70, TICKET_HEIGHT - 92);

  state.currentTicket = ticket;
  state.currentTicketBlob = await new Promise((resolve) => {
    ticketPreviewCanvas.toBlob(resolve, "image/jpeg", 0.92);
  });
  if (state.currentTicketUrl) URL.revokeObjectURL(state.currentTicketUrl);
  state.currentTicketUrl = URL.createObjectURL(state.currentTicketBlob);
}

function saveTicketToHistory(ticket) {
  const history = readTicketHistory().filter((entry) => entry.id !== ticket.id);
  history.unshift(ticket);
  writeTicketHistory(history);
}

function renderTicketHistory() {
  const history = readTicketHistory();
  ticketHistoryList.innerHTML = "";
  if (!history.length) {
    ticketHistoryList.innerHTML = `<div class="empty-state">Aún no hay tickets guardados.</div>`;
    return;
  }
  history.forEach((ticket) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div class="quote-line">
        <strong>${escapeHtml(ticket.clientName)}</strong>
        <span>${formatCurrency(ticket.paidAmount)}</span>
      </div>
      <div>${formatDisplayDate(ticket.date)} - ${ticketTypeLabel(ticket)}</div>
      <div class="history-actions">
        <button class="small-button" type="button" data-open-ticket="${ticket.id}">Ver ticket</button>
        <button class="small-button" type="button" data-delete-ticket="${ticket.id}">Borrar</button>
      </div>
    `;
    ticketHistoryList.appendChild(item);
  });
}

function deleteTicketFromHistory(id) {
  writeTicketHistory(readTicketHistory().filter((ticket) => ticket.id !== id));
  renderTicketHistory();
}

async function openTicketFromHistory(id) {
  const ticket = readTicketHistory().find((entry) => entry.id === id);
  if (!ticket) return;
  await renderTicketPreview(ticket);
  showView("ticketPreview");
}

function downloadCurrentTicket() {
  if (!state.currentTicket || !state.currentTicketUrl) return;
  saveTicketToHistory(state.currentTicket);
  renderTicketHistory();
  const link = document.createElement("a");
  link.href = state.currentTicketUrl;
  link.download = ticketFileName(state.currentTicket);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareCurrentTicket() {
  if (!state.currentTicket || !state.currentTicketBlob) return;
  const file = new File([state.currentTicketBlob], ticketFileName(state.currentTicket), {
    type: "image/jpeg"
  });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "Ticket de pago HYM",
      text: `Ticket de pago para ${state.currentTicket.clientName}`,
      files: [file]
    });
    saveTicketToHistory(state.currentTicket);
    renderTicketHistory();
    return;
  }
  downloadCurrentTicket();
  alert("Tu navegador no permite compartir la imagen directamente. Se descargó el JPG para que puedas enviarlo por WhatsApp.");
}

function resetTicketForm() {
  ticketDate.value = todayValue();
  ticketClientName.value = "";
  ticketType.value = "advance";
  ticketServiceDescription.value = "";
  ticketDetails.value = "";
  ticketTotalAmount.value = "";
  ticketPaidAmount.value = "";
  validateTicketForm();
}

function downloadCurrentPdf() {
  if (!state.currentPdfUrl || !state.currentQuote) return;
  saveQuoteToHistory(state.currentQuote);
  renderHistory();
  const link = document.createElement("a");
  link.href = state.currentPdfUrl;
  link.download = quoteFileName(state.currentQuote);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareCurrentPdf() {
  if (!state.currentPdfBytes || !state.currentQuote) return;
  const file = new File([state.currentPdfBytes], quoteFileName(state.currentQuote), {
    type: "application/pdf"
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "Cotización HYM",
      text: `Cotización para ${state.currentQuote.clientName}`,
      files: [file]
    });
    saveQuoteToHistory(state.currentQuote);
    renderHistory();
    return;
  }

  downloadCurrentPdf();
  alert("Tu navegador no permite compartir archivos directamente. Se descargó el PDF para que puedas enviarlo por WhatsApp.");
}

function resetForm() {
  quoteDate.value = todayValue();
  clientName.value = "";
  commercialConditions.value = "";
  state.items = [];
  createItem();
}

document.getElementById("newQuoteButton").addEventListener("click", () => {
  resetForm();
  showView("form");
});

document.getElementById("newTicketButton").addEventListener("click", () => {
  resetTicketForm();
  showView("ticketForm");
});

document.getElementById("historyButton").addEventListener("click", () => {
  renderHistory();
  showView("history");
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.action));
});

document.getElementById("addItemButton").addEventListener("click", () => {
  if (state.items.length >= MAX_ITEMS_IN_TEMPLATE) {
    alert(`La plantilla permite hasta ${MAX_ITEMS_IN_TEMPLATE} ítems por cotización.`);
    return;
  }
  createItem();
});

itemsList.addEventListener("input", (event) => {
  if (event.target.matches("[data-image-input]")) return;
  const wrapper = event.target.closest(".quote-item");
  if (!wrapper) return;
  const item = state.items.find((entry) => entry.id === wrapper.dataset.id);
  if (!item) return;
  item[event.target.dataset.field] = event.target.value;
  wrapper.querySelector("[data-line-total]").textContent = formatCurrency(lineTotal(item));
  validateForm();
});

itemsList.addEventListener("change", async (event) => {
  if (!event.target.matches("[data-image-input]")) return;
  const wrapper = event.target.closest(".quote-item");
  if (!wrapper) return;
  const item = state.items.find((entry) => entry.id === wrapper.dataset.id);
  const file = event.target.files?.[0];
  if (!item || !file) return;

  item.imageDataUrl = await resizeImageFile(file);
  wrapper.querySelector(".item-image-box").innerHTML = `<img class="item-image-preview" src="${item.imageDataUrl}" alt="Imagen del ítem">`;
});

itemsList.addEventListener("click", (event) => {
  const id = event.target.dataset.remove;
  if (!id) return;
  state.items = state.items.filter((item) => item.id !== id);
  if (!state.items.length) createItem();
  renderItems();
});

quoteDate.addEventListener("input", validateForm);
clientName.addEventListener("input", validateForm);

ticketDate.addEventListener("input", validateTicketForm);
ticketClientName.addEventListener("input", validateTicketForm);
ticketType.addEventListener("change", validateTicketForm);
ticketServiceDescription.addEventListener("input", validateTicketForm);
ticketDetails.addEventListener("input", validateTicketForm);
ticketTotalAmount.addEventListener("input", validateTicketForm);
ticketPaidAmount.addEventListener("input", validateTicketForm);

ticketForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  validateTicketForm();
  if (ticketContinueButton.disabled) return;

  ticketContinueButton.disabled = true;
  ticketContinueButton.textContent = "Generando...";
  try {
    const ticket = collectTicket();
    await renderTicketPreview(ticket);
    showView("ticketPreview");
  } finally {
    ticketContinueButton.textContent = "Continuar";
    validateTicketForm();
  }
});

document.getElementById("ticketHistoryButton").addEventListener("click", () => {
  renderTicketHistory();
  showView("ticketHistory");
});

document.getElementById("downloadTicketButton").addEventListener("click", downloadCurrentTicket);
document.getElementById("shareTicketButton").addEventListener("click", () => {
  shareCurrentTicket().catch(() => downloadCurrentTicket());
});

ticketHistoryList.addEventListener("click", (event) => {
  const openId = event.target.dataset.openTicket;
  if (openId) {
    openTicketFromHistory(openId);
    return;
  }

  const deleteId = event.target.dataset.deleteTicket;
  if (deleteId) deleteTicketFromHistory(deleteId);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  validateForm();
  if (continueButton.disabled) return;

  continueButton.disabled = true;
  continueButton.textContent = "Generando...";
  try {
    const quote = collectQuote();
    const bytes = await generatePdf(quote);
    setPdfPreview(bytes, quote);
    showView("preview");
  } finally {
    continueButton.textContent = "Continuar";
    validateForm();
  }
});

document.getElementById("downloadButton").addEventListener("click", downloadCurrentPdf);
shareButton.addEventListener("click", () => {
  shareCurrentPdf().catch(() => downloadCurrentPdf());
});

historyList.addEventListener("click", (event) => {
  const openId = event.target.dataset.openHistory;
  if (openId) {
    openHistoryQuote(openId);
    return;
  }

  const deleteId = event.target.dataset.deleteHistory;
  if (deleteId) deleteQuoteFromHistory(deleteId);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw-v5.js", { scope: "/" });
  });
}

resetForm();
