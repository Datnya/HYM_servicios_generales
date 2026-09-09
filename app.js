const TEMPLATE_URL = "assets/cotizacion-hym.pdf";
const PREVIEW_TEMPLATE_URL = "assets/cotizacion-preview.png";
const HISTORY_KEY = "hym_quote_history";
const TICKET_HISTORY_KEY = "hym_ticket_history";
const QUOTE_LAYOUT_KEY = "hym_quote_layout";
const QUOTE_SERIAL_KEY = "hym_quote_serial_next";
const QUOTE_LAYOUT_VERSION_KEY = "hym_quote_layout_version";
const QUOTE_LAYOUT_VERSION = 2;
const MAX_QUOTE_ITEMS = 50;
const MAX_ITEM_IMAGE_SIZE = 700;
const PDF_PAGE_WIDTH = 595.5;
const PDF_PAGE_HEIGHT = 842.25;
const TABLE_LEFT = 26;
const TABLE_RIGHT = 570;
const TABLE_HEADER_BOTTOM = 470;
const TABLE_BODY_BOTTOM = 270;
const TABLE_BASE_BODY_HEIGHT = 192;
const TOTAL_ROW_BOTTOM = 215;
const TABLE_COLUMNS = [72, 157, 360, 412, 490];
const SERIAL_X = 405;
const SERIAL_Y = 676;
const SERIAL_WIDTH = 153;
const DOCUMENT_TITLE_X = 60;
const DOCUMENT_TITLE_Y = 680;
const DOCUMENT_TITLE_WIDTH = 330;
const DOCUMENT_TITLE_SIZE = 9.5;
const DOCUMENT_TYPES = Object.freeze({
  allCost: "COTIZACION A TODO COSTO",
  laborOnly: "COTIZACION SOLO MANO DE OBRA",
  contract: "CONTRATO",
  workReport: "REPORTE DEL TRABAJO REALIZADO"
});
const TICKET_WIDTH = 900;
const TICKET_HEIGHT = 1280;
const DEFAULT_QUOTE_LAYOUT = Object.freeze({
  date: { x: 60, y: 662, size: 11 },
  client: { x: 80, y: 616, size: 12 },
  description: { x: 164, y: 450, size: 9 },
  total: { x: 493, y: 233, size: 13 },
  conditions: { x: 38, y: 156, size: 9 }
});

const state = {
  currentPdfUrl: "",
  currentPdfBytes: null,
  currentQuote: null,
  currentTicket: null,
  currentTicketBlob: null,
  currentTicketUrl: "",
  layoutDraft: null,
  editingQuoteId: null,
  editingQuoteCreatedAt: null,
  editingQuoteSerial: null,
  editingTicketId: null,
  editingTicketCreatedAt: null,
  completionEditView: "form",
  items: []
};

const views = {
  home: document.getElementById("homeView"),
  manager: document.getElementById("managerView"),
  form: document.getElementById("formView"),
  preview: document.getElementById("previewView"),
  layoutEditor: document.getElementById("layoutEditorView"),
  history: document.getElementById("historyView"),
  ticketForm: document.getElementById("ticketFormView"),
  ticketPreview: document.getElementById("ticketPreviewView"),
  ticketHistory: document.getElementById("ticketHistoryView")
};

const form = document.getElementById("quoteForm");
const quoteDocumentType = document.getElementById("quoteDocumentType");
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
const ticketMovementType = document.getElementById("ticketMovementType");
const ticketDate = document.getElementById("ticketDate");
const ticketClientName = document.getElementById("ticketClientName");
const ticketClientLabel = document.getElementById("ticketClientLabel");
const ticketType = document.getElementById("ticketType");
const ticketTypeLabelElement = document.getElementById("ticketTypeLabel");
const ticketServiceDescription = document.getElementById("ticketServiceDescription");
const ticketDescriptionLabel = document.getElementById("ticketDescriptionLabel");
const ticketDetails = document.getElementById("ticketDetails");
const ticketTotalAmount = document.getElementById("ticketTotalAmount");
const ticketTotalAmountLabel = document.getElementById("ticketTotalAmountLabel");
const ticketPaidAmount = document.getElementById("ticketPaidAmount");
const ticketPaidAmountLabel = document.getElementById("ticketPaidAmountLabel");
const ticketPendingAmount = document.getElementById("ticketPendingAmount");
const ticketPendingPanel = document.getElementById("ticketPendingPanel");
const ticketContinueButton = document.getElementById("ticketContinueButton");
const ticketPreviewCanvas = document.getElementById("ticketPreviewCanvas");
const ticketHistoryList = document.getElementById("ticketHistoryList");
const managerIncome = document.getElementById("managerIncome");
const managerExpenses = document.getElementById("managerExpenses");
const managerBalance = document.getElementById("managerBalance");
const managerFilter = document.getElementById("managerFilter");
const managerDateFrom = document.getElementById("managerDateFrom");
const managerDateTo = document.getElementById("managerDateTo");
const managerList = document.getElementById("managerList");
const layoutFieldSelect = document.getElementById("layoutFieldSelect");
const layoutX = document.getElementById("layoutX");
const layoutY = document.getElementById("layoutY");
const layoutSize = document.getElementById("layoutSize");
const layoutEditorCanvas = document.getElementById("layoutEditorCanvas");
const layoutEditorStage = document.getElementById("layoutEditorStage");
const saveLayoutButton = document.getElementById("saveLayoutButton");
const completionDialog = document.getElementById("completionDialog");
const completionDialogMessage = document.getElementById("completionDialogMessage");

function showView(name) {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[name].classList.add("active");
}

function cloneQuoteLayout(layout = DEFAULT_QUOTE_LAYOUT) {
  return Object.fromEntries(
    Object.entries(layout).map(([key, value]) => [key, { ...value }])
  );
}

function readQuoteLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(QUOTE_LAYOUT_KEY) || "{}");
    const savedVersion = Number(localStorage.getItem(QUOTE_LAYOUT_VERSION_KEY) || 1);
    if (savedVersion < QUOTE_LAYOUT_VERSION) {
      if (saved.date && Number.isFinite(Number(saved.date.y))) saved.date.y = Number(saved.date.y) - 3;
      if (saved.client && Number.isFinite(Number(saved.client.y))) saved.client.y = Number(saved.client.y) - 3;
      localStorage.setItem(QUOTE_LAYOUT_KEY, JSON.stringify(saved));
      localStorage.setItem(QUOTE_LAYOUT_VERSION_KEY, String(QUOTE_LAYOUT_VERSION));
    }
    const layout = cloneQuoteLayout();
    Object.keys(layout).forEach((key) => {
      const candidate = saved[key];
      if (!candidate) return;
      ["x", "y", "size"].forEach((property) => {
        if (Number.isFinite(Number(candidate[property]))) layout[key][property] = Number(candidate[property]);
      });
    });
    return layout;
  } catch {
    return cloneQuoteLayout();
  }
}

function writeQuoteLayout(layout) {
  localStorage.setItem(QUOTE_LAYOUT_KEY, JSON.stringify(layout));
  localStorage.setItem(QUOTE_LAYOUT_VERSION_KEY, String(QUOTE_LAYOUT_VERSION));
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
  return `cotizacion-hym-${formatQuoteSerial(quote.serial)}-${safeClient || "cliente"}-${quote.date}.pdf`;
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

function formatQuoteSerial(value) {
  const number = Math.max(1, Number.parseInt(String(value || "1"), 10) || 1);
  return String(number).padStart(4, "0");
}

function initializeQuoteSerials() {
  const history = readHistory();
  const existing = history
    .map((quote) => Number.parseInt(String(quote.serial || ""), 10))
    .filter((serial) => Number.isFinite(serial) && serial > 0);
  let next = existing.length ? Math.max(...existing) + 1 : 1;
  let changed = false;

  const withoutSerial = history
    .filter((quote) => !quote.serial)
    .sort((a, b) => String(a.createdAt || a.date).localeCompare(String(b.createdAt || b.date)));
  withoutSerial.forEach((quote) => {
    quote.serial = formatQuoteSerial(next);
    next += 1;
    changed = true;
  });

  if (changed) writeHistory(history);
  const storedNext = Number.parseInt(localStorage.getItem(QUOTE_SERIAL_KEY) || "1", 10) || 1;
  localStorage.setItem(QUOTE_SERIAL_KEY, String(Math.max(storedNext, next)));
}

function allocateQuoteSerial() {
  const next = Number.parseInt(localStorage.getItem(QUOTE_SERIAL_KEY) || "1", 10) || 1;
  localStorage.setItem(QUOTE_SERIAL_KEY, String(next + 1));
  return formatQuoteSerial(next);
}

function quoteSerialLabel(quote) {
  return `N° ${formatQuoteSerial(quote.serial)}`;
}

function quoteDocumentTitle(quote) {
  return DOCUMENT_TYPES[quote.documentType] || DOCUMENT_TYPES.allCost;
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
    state.items.length <= MAX_QUOTE_ITEMS;
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
  const serial = state.editingQuoteSerial || allocateQuoteSerial();
  return {
    id: state.editingQuoteId || crypto.randomUUID(),
    createdAt: state.editingQuoteCreatedAt || new Date().toISOString(),
    serial,
    documentType: quoteDocumentType.value,
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

function loadQuoteIntoForm(quote) {
  quoteDocumentType.value = DOCUMENT_TYPES[quote.documentType] ? quote.documentType : "allCost";
  quoteDate.value = quote.date;
  clientName.value = quote.clientName || "";
  commercialConditions.value = quote.commercialConditions || "";
  state.items = (quote.items || []).map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID()
  }));
  state.editingQuoteId = quote.id;
  state.editingQuoteCreatedAt = quote.createdAt;
  state.editingQuoteSerial = quote.serial || allocateQuoteSerial();
  if (!state.items.length) createItem();
  else renderItems();
  validateForm();
}

function rememberQuoteEditingContext(quote) {
  state.editingQuoteId = quote.id;
  state.editingQuoteCreatedAt = quote.createdAt;
  state.editingQuoteSerial = quote.serial;
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
  const pageHeight = context.__pdfPageHeight || PDF_PAGE_HEIGHT;
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  const scaleY = context.canvas.height / pageHeight;
  context.font = `${bold ? "700 " : ""}${size * scaleY}px Arial`;
  context.fillStyle = "#000000";
  context.textBaseline = "alphabetic";
  context.fillText(String(text), x * scaleX, (pageHeight - y) * scaleY);
}

function drawPreviewRight(context, text, x, y, width, size, bold = false) {
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  const value = String(text);
  context.font = `${bold ? "700 " : ""}${size * scaleX}px Arial`;
  const textWidth = context.measureText(value).width;
  drawPreviewText(context, value, x + width - textWidth / scaleX, y, size, bold);
}

function drawPreviewCenter(context, text, x, y, width, size, bold = false) {
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  const value = String(text);
  context.font = `${bold ? "700 " : ""}${size * scaleX}px Arial`;
  const textWidth = context.measureText(value).width;
  drawPreviewText(context, value, x + (width - textWidth / scaleX) / 2, y, size, bold);
}

function wrapCanvasText(context, text, size, maxWidth) {
  const scaleX = context.canvas.width / PDF_PAGE_WIDTH;
  context.font = `${size * scaleX}px Arial`;
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

function drawPreviewRectangle(context, x, y, width, height, fill, stroke = "#000000") {
  const pageHeight = context.__pdfPageHeight || PDF_PAGE_HEIGHT;
  const scale = context.canvas.width / PDF_PAGE_WIDTH;
  const canvasY = (pageHeight - y - height) * scale;
  context.fillStyle = fill;
  context.fillRect(x * scale, canvasY, width * scale, height * scale);
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = Math.max(1, scale);
    context.strokeRect(x * scale, canvasY, width * scale, height * scale);
  }
}

function drawPreviewLine(context, x1, y1, x2, y2) {
  const pageHeight = context.__pdfPageHeight || PDF_PAGE_HEIGHT;
  const scale = context.canvas.width / PDF_PAGE_WIDTH;
  context.strokeStyle = "#000000";
  context.lineWidth = Math.max(1, scale);
  context.beginPath();
  context.moveTo(x1 * scale, (pageHeight - y1) * scale);
  context.lineTo(x2 * scale, (pageHeight - y2) * scale);
  context.stroke();
}

function drawDynamicPreviewStructure(context, tableLayout) {
  const bodyTop = TABLE_HEADER_BOTTOM + tableLayout.extraHeight;
  drawPreviewRectangle(context, 0, 0, PDF_PAGE_WIDTH, bodyTop, "#ffffff", null);
  drawPreviewRectangle(context, TABLE_LEFT, TABLE_BODY_BOTTOM, TABLE_RIGHT - TABLE_LEFT, bodyTop - TABLE_BODY_BOTTOM, "#ffffff");
  TABLE_COLUMNS.forEach((x) => drawPreviewLine(context, x, TABLE_BODY_BOTTOM, x, bodyTop));
  tableLayout.rows.forEach((row) => drawPreviewLine(context, TABLE_LEFT, row.rowBottom, TABLE_RIGHT, row.rowBottom));
  drawPreviewRectangle(context, TABLE_LEFT, TOTAL_ROW_BOTTOM, 490 - TABLE_LEFT, TABLE_BODY_BOTTOM - TOTAL_ROW_BOTTOM, "#d9d9d9");
  drawPreviewRectangle(context, 490, TOTAL_ROW_BOTTOM, TABLE_RIGHT - 490, TABLE_BODY_BOTTOM - TOTAL_ROW_BOTTOM, "#ffffff");
  drawPreviewText(context, "COSTO TOTAL", 405, 240, 11, true);
  drawPreviewText(context, "CONDICIONES COMERCIALES", 38, 178, 13, true);
  drawPreviewRectangle(context, 0, 0, PDF_PAGE_WIDTH, 13, "#fedd58", null);
}

function createItemTableLayout(items, wrapDescription, options = {}) {
  const fontSize = Number(options.fontSize || 9);
  const lineHeight = fontSize + 2;
  const rows = [];

  items.forEach((item, itemIndex) => {
    const lines = wrapDescription(item.description, fontSize);
    rows.push({
      item,
      itemIndex,
      lines,
      fontSize,
      lineHeight,
      height: Math.max(item.imageDataUrl ? 54 : 24, lines.length * lineHeight + 10)
    });
  });

  const contentHeight = rows.reduce((total, row) => total + row.height, 0);
  const bodyHeight = Math.max(TABLE_BASE_BODY_HEIGHT, contentHeight + 8);
  const extraHeight = bodyHeight - TABLE_BASE_BODY_HEIGHT;
  let rowTop = Number(options.startY || 450) + extraHeight + fontSize + 7;
  const positionedRows = rows.map((row) => {
    const rowY = rowTop - row.fontSize - 7;
    const positionedRow = { ...row, rowTop, rowY, rowBottom: rowTop - row.height };
    rowTop -= row.height;
    return positionedRow;
  });

  return {
    rows: positionedRows,
    bodyHeight,
    extraHeight,
    pageHeight: PDF_PAGE_HEIGHT + extraHeight
  };
}

function wrapCanvasTextPreservingBreaks(context, text, size, maxWidth) {
  return String(text)
    .split(/\r?\n/)
    .flatMap((paragraph) => {
      const trimmed = paragraph.trim();
      return trimmed ? wrapCanvasText(context, trimmed, size, maxWidth) : [""];
    });
}

async function renderQuotePreview(quote, options = {}) {
  const layout = options.layout || readQuoteLayout();
  const pagesElement = options.pagesElement || pdfPreviewPages;
  const primaryCanvas = options.primaryCanvas || pdfPreviewCanvas;
  const template = await loadImage(PREVIEW_TEMPLATE_URL);
  const measurementCanvas = document.createElement("canvas");
  measurementCanvas.width = template.naturalWidth;
  measurementCanvas.height = template.naturalHeight;
  const measurementContext = measurementCanvas.getContext("2d");
  const tableLayout = createItemTableLayout(
    quote.items,
    (description, size) => wrapCanvasText(measurementContext, description, size, 190),
    { fontSize: layout.description.size, startY: layout.description.y }
  );

  pagesElement.innerHTML = "";
  pagesElement.appendChild(primaryCanvas);
  const scale = template.naturalWidth / PDF_PAGE_WIDTH;
  primaryCanvas.className = "pdf-preview-page";
  primaryCanvas.width = template.naturalWidth;
  primaryCanvas.height = Math.round(tableLayout.pageHeight * scale);
  const context = primaryCanvas.getContext("2d");
  context.__pdfPageHeight = tableLayout.pageHeight;
  context.drawImage(template, 0, 0, template.naturalWidth, template.naturalHeight);
  drawDynamicPreviewStructure(context, tableLayout);

  drawPreviewText(context, formatDisplayDate(quote.date), layout.date.x, layout.date.y + tableLayout.extraHeight, layout.date.size);
  drawPreviewText(context, quote.clientName, layout.client.x, layout.client.y + tableLayout.extraHeight, layout.client.size, true);
  drawPreviewRight(
    context,
    quoteSerialLabel(quote),
    SERIAL_X,
    SERIAL_Y + tableLayout.extraHeight,
    SERIAL_WIDTH,
    10,
    true
  );
  drawPreviewCenter(
    context,
    quoteDocumentTitle(quote),
    DOCUMENT_TITLE_X,
    DOCUMENT_TITLE_Y + tableLayout.extraHeight,
    DOCUMENT_TITLE_WIDTH,
    DOCUMENT_TITLE_SIZE,
    true
  );

  for (const row of tableLayout.rows) {
    const { item, itemIndex, lines, fontSize, lineHeight, rowY } = row;
    drawPreviewText(context, String(itemIndex + 1), 46, rowY, 10, true);

    if (item.imageDataUrl) {
      try {
        const image = await loadImage(item.imageDataUrl);
        const size = fitInside(image.naturalWidth, image.naturalHeight, 70, 44);
        const imageX = 115 - size.width / 2;
        const imageY = row.rowTop - 5 - size.height;
        context.drawImage(
          image,
          imageX * scale,
          (tableLayout.pageHeight - imageY - size.height) * scale,
          size.width * scale,
          size.height * scale
        );
      } catch {
        drawPreviewText(context, "Imagen no disponible", 76, rowY, 7);
      }
    }

    lines.forEach((line, lineIndex) => {
      drawPreviewText(context, line, layout.description.x, rowY - lineIndex * lineHeight, fontSize);
    });
    drawPreviewRight(context, item.quantity, 360, rowY, 45, 10);
    drawPreviewRight(context, formatCurrency(item.unitValue), 414, rowY, 62, 9);
    drawPreviewRight(context, formatCurrency(item.total), 486, rowY, 72, 9, true);
  }

  drawPreviewCenter(context, formatCurrency(quote.total), layout.total.x, layout.total.y, 65, Math.min(layout.total.size, 11), true);

  if (quote.commercialConditions) {
    wrapCanvasTextPreservingBreaks(context, quote.commercialConditions, layout.conditions.size, 500).forEach((line, lineIndex) => {
      if (line) drawPreviewText(context, line, layout.conditions.x, layout.conditions.y - lineIndex * (layout.conditions.size + 3), layout.conditions.size);
    });
  }

  if (options.selectedField) {
    const selected = layout[options.selectedField];
    const anchoredToTop = ["date", "client", "description"].includes(options.selectedField);
    const selectedY = selected.y + (anchoredToTop ? tableLayout.extraHeight : 0);
    const markerX = selected.x * scale;
    const markerY = (tableLayout.pageHeight - selectedY) * scale;
    context.strokeStyle = "#fedd58";
    context.lineWidth = 8;
    context.beginPath();
    context.arc(markerX, markerY, 16, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(markerX - 22, markerY);
    context.lineTo(markerX + 22, markerY);
    context.moveTo(markerX, markerY - 22);
    context.lineTo(markerX, markerY + 22);
    context.stroke();
  }
}

function syncLayoutControls() {
  const selected = state.layoutDraft[layoutFieldSelect.value];
  layoutX.value = selected.x;
  layoutY.value = selected.y;
  layoutSize.value = selected.size;
}

let layoutRenderFrame = 0;
function queueLayoutEditorRender() {
  cancelAnimationFrame(layoutRenderFrame);
  layoutRenderFrame = requestAnimationFrame(() => {
    renderQuotePreview(state.currentQuote, {
      layout: state.layoutDraft,
      pagesElement: layoutEditorStage,
      primaryCanvas: layoutEditorCanvas,
      maxPages: 1,
      selectedField: layoutFieldSelect.value
    });
  });
}

function updateLayoutDraftFromControls() {
  const selected = state.layoutDraft[layoutFieldSelect.value];
  selected.x = Number(layoutX.value || 0);
  selected.y = Number(layoutY.value || 0);
  selected.size = Math.max(5, Number(layoutSize.value || 5));
  queueLayoutEditorRender();
}

function openLayoutEditor() {
  if (!state.currentQuote) return;
  state.layoutDraft = readQuoteLayout();
  syncLayoutControls();
  showView("layoutEditor");
  queueLayoutEditorRender();
}

function moveSelectedLayoutField(event) {
  const rect = layoutEditorCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const selected = state.layoutDraft[layoutFieldSelect.value];
  const pageHeight = (layoutEditorCanvas.height / layoutEditorCanvas.width) * PDF_PAGE_WIDTH;
  const extraHeight = Math.max(0, pageHeight - PDF_PAGE_HEIGHT);
  const anchoredToTop = ["date", "client", "description"].includes(layoutFieldSelect.value);
  selected.x = Math.max(0, Math.min(PDF_PAGE_WIDTH, ((event.clientX - rect.left) / rect.width) * PDF_PAGE_WIDTH));
  const pageY = pageHeight - ((event.clientY - rect.top) / rect.height) * pageHeight;
  selected.y = Math.max(0, Math.min(PDF_PAGE_HEIGHT, pageY - (anchoredToTop ? extraHeight : 0)));
  syncLayoutControls();
  queueLayoutEditorRender();
}

function drawDynamicPdfStructure(page, tableLayout, boldFont) {
  const bodyTop = TABLE_HEADER_BOTTOM + tableLayout.extraHeight;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PDF_PAGE_WIDTH,
    height: bodyTop,
    color: PDFLib.rgb(1, 1, 1)
  });
  page.drawRectangle({
    x: TABLE_LEFT,
    y: TABLE_BODY_BOTTOM,
    width: TABLE_RIGHT - TABLE_LEFT,
    height: bodyTop - TABLE_BODY_BOTTOM,
    color: PDFLib.rgb(1, 1, 1),
    borderColor: PDFLib.rgb(0, 0, 0),
    borderWidth: 0.8
  });
  TABLE_COLUMNS.forEach((x) => page.drawLine({
    start: { x, y: TABLE_BODY_BOTTOM },
    end: { x, y: bodyTop },
    color: PDFLib.rgb(0, 0, 0),
    thickness: 0.8
  }));
  tableLayout.rows.forEach((row) => page.drawLine({
    start: { x: TABLE_LEFT, y: row.rowBottom },
    end: { x: TABLE_RIGHT, y: row.rowBottom },
    color: PDFLib.rgb(0, 0, 0),
    thickness: 0.8
  }));
  page.drawRectangle({
    x: TABLE_LEFT,
    y: TOTAL_ROW_BOTTOM,
    width: 490 - TABLE_LEFT,
    height: TABLE_BODY_BOTTOM - TOTAL_ROW_BOTTOM,
    color: PDFLib.rgb(0.85, 0.85, 0.85),
    borderColor: PDFLib.rgb(0, 0, 0),
    borderWidth: 0.8
  });
  page.drawRectangle({
    x: 490,
    y: TOTAL_ROW_BOTTOM,
    width: TABLE_RIGHT - 490,
    height: TABLE_BODY_BOTTOM - TOTAL_ROW_BOTTOM,
    color: PDFLib.rgb(1, 1, 1),
    borderColor: PDFLib.rgb(0, 0, 0),
    borderWidth: 0.8
  });
  drawText(page, "COSTO TOTAL", { x: 405, y: 240, size: 11, font: boldFont });
  drawText(page, "CONDICIONES COMERCIALES", { x: 38, y: 178, size: 13, font: boldFont });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PDF_PAGE_WIDTH,
    height: 13,
    color: PDFLib.rgb(0.996, 0.867, 0.345)
  });
}

async function generatePdf(quote) {
  const layout = readQuoteLayout();
  const templateBytes = await fetch(TEMPLATE_URL).then((response) => response.arrayBuffer());
  const templateDoc = await PDFLib.PDFDocument.load(templateBytes);
  const pdfDoc = await PDFLib.PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

  const tableLayout = createItemTableLayout(
    quote.items,
    (description, size) => wrapText(description, regularFont, size, 190),
    { fontSize: layout.description.size, startY: layout.description.y }
  );

  const templatePage = await pdfDoc.embedPage(templateDoc.getPage(0));
  const page = pdfDoc.addPage([PDF_PAGE_WIDTH, tableLayout.pageHeight]);
  page.drawPage(templatePage, {
    x: 0,
    y: tableLayout.extraHeight,
    width: PDF_PAGE_WIDTH,
    height: PDF_PAGE_HEIGHT
  });
  drawDynamicPdfStructure(page, tableLayout, boldFont);
  drawText(page, formatDisplayDate(quote.date), {
    ...layout.date,
    y: layout.date.y + tableLayout.extraHeight,
    font: regularFont
  });
  drawText(page, quote.clientName, {
    ...layout.client,
    y: layout.client.y + tableLayout.extraHeight,
    font: boldFont
  });
  drawRight(
    page,
    quoteSerialLabel(quote),
    SERIAL_X,
    SERIAL_Y + tableLayout.extraHeight,
    SERIAL_WIDTH,
    10,
    boldFont
  );
  drawCenter(
    page,
    quoteDocumentTitle(quote),
    DOCUMENT_TITLE_X,
    DOCUMENT_TITLE_Y + tableLayout.extraHeight,
    DOCUMENT_TITLE_WIDTH,
    DOCUMENT_TITLE_SIZE,
    boldFont
  );

  for (const row of tableLayout.rows) {
      const { item, itemIndex, lines, fontSize, lineHeight, rowY } = row;
      drawText(page, String(itemIndex + 1), { x: 46, y: rowY, size: 10, font: boldFont });
      if (item.imageDataUrl) {
        try {
          const image = await embedItemImage(pdfDoc, item.imageDataUrl);
          const size = fitInside(image.width, image.height, 70, 44);
          page.drawImage(image, {
            x: 115 - size.width / 2,
            y: row.rowTop - 5 - size.height,
            width: size.width,
            height: size.height
          });
        } catch {
          drawText(page, "Imagen no disponible", { x: 76, y: rowY, size: 7, font: regularFont });
        }
      }
      lines.forEach((line, lineIndex) => {
        drawText(page, line, {
          x: layout.description.x,
          y: rowY - lineIndex * lineHeight,
          size: fontSize,
          font: regularFont
        });
      });
      drawRight(page, item.quantity, 360, rowY, 45, 10, regularFont);
      drawRight(page, formatCurrency(item.unitValue), 414, rowY, 62, 9, regularFont);
      drawRight(page, formatCurrency(item.total), 486, rowY, 72, 9, boldFont);
  }

  drawCenter(page, formatCurrency(quote.total), layout.total.x, layout.total.y, 65, Math.min(layout.total.size, 11), boldFont);

  if (quote.commercialConditions) {
      wrapTextPreservingBreaks(quote.commercialConditions, regularFont, layout.conditions.size, 500).forEach((line, lineIndex) => {
        if (!line) return;
        drawText(page, line, {
          x: layout.conditions.x,
          y: layout.conditions.y - lineIndex * (layout.conditions.size + 3),
          size: layout.conditions.size,
          font: regularFont
        });
      });
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
    serial: quote.serial,
    documentType: quote.documentType || "allCost",
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
    historyList.innerHTML = `<div class="empty-state">Aún no hay documentos guardados.</div>`;
    return;
  }

  history.forEach((quote) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div class="quote-line">
        <strong>${escapeHtml(quoteDocumentTitle(quote))} N° ${formatQuoteSerial(quote.serial)}</strong>
        <span>${formatCurrency(quote.total)}</span>
      </div>
      <div>${escapeHtml(quote.clientName)} - ${formatDisplayDate(quote.date)}</div>
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
  renderManager();
}

async function openHistoryQuote(id) {
  const quote = readHistory().find((entry) => entry.id === id);
  if (!quote) return;
  loadQuoteIntoForm(quote);
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
  const movement = ticket.movementType === "expense" ? "egreso" : "ingreso";
  return `ticket-${movement}-hym-${safeClient || "cliente"}-${ticket.date}.jpg`;
}

function ticketPendingValue() {
  if (ticketMovementType.value === "expense") return 0;
  if (ticketType.value !== "advance") return 0;
  return Math.max(0, Number(ticketTotalAmount.value || 0) - Number(ticketPaidAmount.value || 0));
}

function validateTicketForm() {
  const isExpense = ticketMovementType.value === "expense";
  const isAdvance = !isExpense && ticketType.value === "advance";
  ticketTypeLabelElement.style.display = isExpense ? "none" : "grid";
  ticketTotalAmountLabel.style.display = isAdvance ? "grid" : "none";
  ticketPendingPanel.style.display = isAdvance ? "flex" : "none";
  ticketClientLabel.textContent = isExpense ? "Persona o proveedor" : "Nombre del cliente";
  ticketDescriptionLabel.textContent = isExpense ? "Descripción del egreso" : "Descripción del servicio";
  ticketPaidAmountLabel.textContent = isExpense ? "Monto del egreso" : "Monto cobrado";
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
  const isExpense = ticketMovementType.value === "expense";
  const isAdvance = !isExpense && ticketType.value === "advance";
  const paidAmount = Number(ticketPaidAmount.value || 0);
  const totalAmount = isAdvance ? Number(ticketTotalAmount.value || 0) : paidAmount;
  return {
    id: state.editingTicketId || crypto.randomUUID(),
    createdAt: state.editingTicketCreatedAt || new Date().toISOString(),
    date: ticketDate.value,
    clientName: ticketClientName.value.trim(),
    movementType: isExpense ? "expense" : "income",
    type: isExpense ? "expense" : ticketType.value,
    serviceDescription: ticketServiceDescription.value.trim(),
    details: ticketDetails.value.trim(),
    paidAmount,
    totalAmount,
    pendingAmount: isAdvance ? Math.max(0, totalAmount - paidAmount) : 0
  };
}

function loadTicketIntoForm(ticket) {
  ticketMovementType.value = ticket.movementType === "expense" || ticket.type === "expense" ? "expense" : "income";
  ticketDate.value = ticket.date;
  ticketClientName.value = ticket.clientName || "";
  ticketType.value = ticket.type === "full" ? "full" : "advance";
  ticketServiceDescription.value = ticket.serviceDescription || "";
  ticketDetails.value = ticket.details || "";
  ticketTotalAmount.value = ticket.totalAmount || "";
  ticketPaidAmount.value = ticket.paidAmount || "";
  state.editingTicketId = ticket.id;
  state.editingTicketCreatedAt = ticket.createdAt;
  validateTicketForm();
}

function rememberTicketEditingContext(ticket) {
  state.editingTicketId = ticket.id;
  state.editingTicketCreatedAt = ticket.createdAt;
}

function ticketTypeLabel(ticket) {
  if (ticket.movementType === "expense" || ticket.type === "expense") return "Egreso";
  return ticket.type === "advance" ? "Adelanto" : "Pago total";
}

function ticketMovementLabel(ticket) {
  return ticket.movementType === "expense" || ticket.type === "expense" ? "Egreso" : "Ingreso";
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
  context.fillText(ticket.movementType === "expense" ? "TICKET DE EGRESO" : "TICKET DE PAGO", 190, 126);

  context.textAlign = "center";
  context.font = "700 42px Arial";
  context.fillText(ticketTypeLabel(ticket).toUpperCase(), TICKET_WIDTH / 2, 235);
  context.textAlign = "left";

  const isExpense = ticket.movementType === "expense" || ticket.type === "expense";
  const rows = [
    ["Fecha", formatDisplayDate(ticket.date)],
    [isExpense ? "Persona / proveedor" : "Cliente", ticket.clientName],
    [isExpense ? "Descripción" : "Servicio", ticket.serviceDescription],
    ["Detalles", ticket.details || "-"],
    [isExpense ? "Monto del egreso" : "Monto cobrado", formatCurrency(ticket.paidAmount)]
  ];
  if (!isExpense) rows.push(["Monto total", formatCurrency(ticket.totalAmount)]);
  if (ticket.type === "advance") rows.push(["Saldo pendiente", formatCurrency(ticket.pendingAmount)]);

  let y = 310;
  rows.forEach(([label, value]) => {
    context.font = "700 28px Arial";
    context.fillStyle = "#000000";
    const labelText = `${label}:`;
    context.fillText(labelText, 70, y);
    const valueX = Math.max(310, 70 + context.measureText(labelText).width + 24);
    context.font = "28px Arial";
    y = drawTicketWrappedText(context, value, valueX, y, TICKET_WIDTH - valueX - 70, 36, "28px Arial") + 24;
  });

  context.fillStyle = "#fedd58";
  context.fillRect(70, y + 15, TICKET_WIDTH - 140, 110);
  context.strokeStyle = "#000000";
  context.lineWidth = 4;
  context.strokeRect(70, y + 15, TICKET_WIDTH - 140, 110);
  context.textAlign = "center";
  context.fillStyle = "#000000";
  context.font = "700 30px Arial";
  context.fillText(isExpense ? "EGRESO REGISTRADO" : ticket.type === "advance" ? "SALDO PENDIENTE" : "PAGO COMPLETADO", TICKET_WIDTH / 2, y + 58);
  context.font = "700 42px Arial";
  context.fillText(ticket.type === "advance" ? formatCurrency(ticket.pendingAmount) : formatCurrency(ticket.paidAmount), TICKET_WIDTH / 2, y + 105);
  context.textAlign = "left";

  context.font = "24px Arial";
  context.fillText(isExpense ? "Registro de egreso de HYM Servicios Generales." : "Gracias por confiar en HYM Servicios Generales.", 70, TICKET_HEIGHT - 92);

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
    const isExpense = ticket.movementType === "expense" || ticket.type === "expense";
    const item = document.createElement("article");
    item.className = `history-item${isExpense ? " expense-entry" : ""}`;
    item.innerHTML = `
      <div class="quote-line">
        <strong>${escapeHtml(ticket.clientName)}</strong>
        <span>${isExpense ? "-" : ""}${formatCurrency(ticket.paidAmount)}</span>
      </div>
      <div>${formatDisplayDate(ticket.date)} - ${ticketMovementLabel(ticket)} - ${ticketTypeLabel(ticket)}</div>
      <div class="history-actions">
        <button class="small-button" type="button" data-open-ticket="${ticket.id}">Ver ticket</button>
        <button class="small-button" type="button" data-delete-ticket="${ticket.id}">Borrar</button>
      </div>
    `;
    ticketHistoryList.appendChild(item);
  });
}

function managerTransactions() {
  const tickets = readTicketHistory().map((ticket) => {
    const movementType = ticket.movementType === "expense" || ticket.type === "expense" ? "expense" : "income";
    return {
      id: ticket.id,
      source: movementType === "expense" ? "expenses" : "tickets",
      movementType,
      date: ticket.date,
      createdAt: ticket.createdAt,
      name: ticket.clientName,
      description: ticket.serviceDescription,
      amount: Number(ticket.paidAmount || 0)
    };
  });
  return tickets.sort((a, b) =>
    String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date))
  );
}

function renderManager() {
  const transactions = managerTransactions();
  const sourceFiltered = managerFilter.value === "all"
    ? transactions
    : transactions.filter((entry) => entry.source === managerFilter.value);
  const filtered = sourceFiltered.filter((entry) => {
    if (managerDateFrom.value && entry.date < managerDateFrom.value) return false;
    if (managerDateTo.value && entry.date > managerDateTo.value) return false;
    return true;
  });
  const income = filtered
    .filter((entry) => entry.movementType === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expenses = filtered
    .filter((entry) => entry.movementType === "expense")
    .reduce((total, entry) => total + entry.amount, 0);

  managerIncome.textContent = formatCurrency(income);
  managerExpenses.textContent = formatCurrency(expenses);
  managerBalance.textContent = formatCurrency(income - expenses);

  managerList.innerHTML = "";
  if (!filtered.length) {
    managerList.innerHTML = `<div class="empty-state">No hay movimientos en este filtro.</div>`;
    return;
  }

  filtered.forEach((entry) => {
    const item = document.createElement("article");
    item.className = `history-item${entry.movementType === "expense" ? " expense-entry" : ""}`;
    item.innerHTML = `
      <div class="quote-line">
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${entry.movementType === "expense" ? "-" : "+"}${formatCurrency(entry.amount)}</span>
      </div>
      <div class="movement-kind">${entry.movementType === "expense" ? "Egreso" : "Ingreso - Ticket"}</div>
      <div>${formatDisplayDate(entry.date)} - ${escapeHtml(entry.description || "Sin descripción")}</div>
      <button class="small-button manager-preview-action" type="button" data-manager-preview="${entry.id}" data-manager-source="${entry.source}">Previsualizar</button>
    `;
    managerList.appendChild(item);
  });
}

function deleteTicketFromHistory(id) {
  writeTicketHistory(readTicketHistory().filter((ticket) => ticket.id !== id));
  renderTicketHistory();
  renderManager();
}

async function openTicketFromHistory(id) {
  const ticket = readTicketHistory().find((entry) => entry.id === id);
  if (!ticket) return;
  loadTicketIntoForm(ticket);
  await renderTicketPreview(ticket);
  showView("ticketPreview");
}

function showCompletionDialog(documentType, action, editView) {
  const label = documentType === "quote" ? "Documento" : "Ticket";
  const actionLabel = documentType === "quote"
    ? action === "shared" ? "compartido" : "descargado"
    : action === "shared" ? "compartido" : "descargado";
  state.completionEditView = editView;
  completionDialogMessage.textContent = `${label} ${actionLabel}. ¿Volver al inicio?`;
  if (typeof completionDialog.showModal === "function") {
    completionDialog.showModal();
    return;
  }
  showView(window.confirm(completionDialogMessage.textContent) ? "home" : editView);
}

function downloadCurrentTicket(options = {}) {
  if (!state.currentTicket || !state.currentTicketUrl) return;
  saveTicketToHistory(state.currentTicket);
  renderTicketHistory();
  renderManager();
  const link = document.createElement("a");
  link.href = state.currentTicketUrl;
  link.download = ticketFileName(state.currentTicket);
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (options.showConfirmation !== false) showCompletionDialog("ticket", "downloaded", "ticketForm");
}

async function shareCurrentTicket() {
  if (!state.currentTicket || !state.currentTicketBlob) return;
  const file = new File([state.currentTicketBlob], ticketFileName(state.currentTicket), {
    type: "image/jpeg"
  });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: state.currentTicket.movementType === "expense" ? "Ticket de egreso HYM" : "Ticket de pago HYM",
      text: `${state.currentTicket.movementType === "expense" ? "Ticket de egreso" : "Ticket de pago"} para ${state.currentTicket.clientName}`,
      files: [file]
    });
    saveTicketToHistory(state.currentTicket);
    renderTicketHistory();
    renderManager();
    showCompletionDialog("ticket", "shared", "ticketForm");
    return;
  }
  downloadCurrentTicket({ showConfirmation: false });
  showCompletionDialog("ticket", "downloaded", "ticketForm");
}

function resetTicketForm() {
  ticketMovementType.value = "income";
  ticketDate.value = todayValue();
  ticketClientName.value = "";
  ticketType.value = "advance";
  ticketServiceDescription.value = "";
  ticketDetails.value = "";
  ticketTotalAmount.value = "";
  ticketPaidAmount.value = "";
  state.editingTicketId = null;
  state.editingTicketCreatedAt = null;
  state.currentTicket = null;
  validateTicketForm();
}

function downloadCurrentPdf(options = {}) {
  if (!state.currentPdfUrl || !state.currentQuote) return;
  saveQuoteToHistory(state.currentQuote);
  renderHistory();
  renderManager();
  const link = document.createElement("a");
  link.href = state.currentPdfUrl;
  link.download = quoteFileName(state.currentQuote);
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (options.showConfirmation !== false) showCompletionDialog("quote", "downloaded", "form");
}

async function shareCurrentPdf() {
  if (!state.currentPdfBytes || !state.currentQuote) return;
  const file = new File([state.currentPdfBytes], quoteFileName(state.currentQuote), {
    type: "application/pdf"
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "Documento HYM",
      text: `${quoteDocumentTitle(state.currentQuote)} para ${state.currentQuote.clientName}`,
      files: [file]
    });
    saveQuoteToHistory(state.currentQuote);
    renderHistory();
    renderManager();
    showCompletionDialog("quote", "shared", "form");
    return;
  }

  downloadCurrentPdf({ showConfirmation: false });
  showCompletionDialog("quote", "downloaded", "form");
}

function resetForm() {
  quoteDocumentType.value = "allCost";
  quoteDate.value = todayValue();
  clientName.value = "";
  commercialConditions.value = "";
  state.editingQuoteId = null;
  state.editingQuoteCreatedAt = null;
  state.editingQuoteSerial = null;
  state.currentQuote = null;
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

document.getElementById("managerButton").addEventListener("click", () => {
  renderManager();
  showView("manager");
});

document.getElementById("quoteHistoryButton").addEventListener("click", () => {
  renderHistory();
  showView("history");
});

document.getElementById("managerTicketHistoryButton").addEventListener("click", () => {
  renderTicketHistory();
  showView("ticketHistory");
});

document.getElementById("openLayoutEditorButton").addEventListener("click", openLayoutEditor);

layoutFieldSelect.addEventListener("change", () => {
  syncLayoutControls();
  queueLayoutEditorRender();
});

[layoutX, layoutY, layoutSize].forEach((input) => {
  input.addEventListener("input", updateLayoutDraftFromControls);
});

document.getElementById("resetLayoutFieldButton").addEventListener("click", () => {
  state.layoutDraft[layoutFieldSelect.value] = { ...DEFAULT_QUOTE_LAYOUT[layoutFieldSelect.value] };
  syncLayoutControls();
  queueLayoutEditorRender();
});

let draggingLayoutField = false;
layoutEditorCanvas.addEventListener("pointerdown", (event) => {
  draggingLayoutField = true;
  layoutEditorCanvas.setPointerCapture(event.pointerId);
  moveSelectedLayoutField(event);
});
layoutEditorCanvas.addEventListener("pointermove", (event) => {
  if (draggingLayoutField) moveSelectedLayoutField(event);
});
layoutEditorCanvas.addEventListener("pointerup", (event) => {
  draggingLayoutField = false;
  if (layoutEditorCanvas.hasPointerCapture(event.pointerId)) layoutEditorCanvas.releasePointerCapture(event.pointerId);
});
layoutEditorCanvas.addEventListener("pointercancel", () => {
  draggingLayoutField = false;
});

saveLayoutButton.addEventListener("click", async () => {
  if (!state.currentQuote || !state.layoutDraft) return;
  saveLayoutButton.disabled = true;
  saveLayoutButton.textContent = "Guardando...";
  try {
    writeQuoteLayout(state.layoutDraft);
    const bytes = await generatePdf(state.currentQuote);
    setPdfPreview(bytes, state.currentQuote);
    showView("preview");
  } finally {
    saveLayoutButton.disabled = false;
    saveLayoutButton.textContent = "Guardar en PDF";
  }
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.action));
});

document.getElementById("addItemButton").addEventListener("click", () => {
  if (state.items.length >= MAX_QUOTE_ITEMS) {
    alert(`La cotización permite hasta ${MAX_QUOTE_ITEMS} ítems.`);
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
quoteDocumentType.addEventListener("change", validateForm);
clientName.addEventListener("input", validateForm);

ticketDate.addEventListener("input", validateTicketForm);
ticketMovementType.addEventListener("change", validateTicketForm);
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
    rememberTicketEditingContext(ticket);
    await renderTicketPreview(ticket);
    showView("ticketPreview");
  } finally {
    ticketContinueButton.textContent = "Continuar";
    validateTicketForm();
  }
});

managerFilter.addEventListener("change", renderManager);
managerDateFrom.addEventListener("change", renderManager);
managerDateTo.addEventListener("change", renderManager);
document.getElementById("clearManagerDatesButton").addEventListener("click", () => {
  managerDateFrom.value = "";
  managerDateTo.value = "";
  renderManager();
});

managerList.addEventListener("click", (event) => {
  const id = event.target.dataset.managerPreview;
  if (!id) return;
  openTicketFromHistory(id);
});

document.getElementById("downloadTicketButton").addEventListener("click", () => downloadCurrentTicket());
document.getElementById("shareTicketButton").addEventListener("click", async () => {
  try {
    await shareCurrentTicket();
  } catch (error) {
    if (error?.name !== "AbortError") alert("No se pudo compartir el ticket. Inténtalo nuevamente.");
  }
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
    rememberQuoteEditingContext(quote);
    const bytes = await generatePdf(quote);
    setPdfPreview(bytes, quote);
    showView("preview");
  } finally {
    continueButton.textContent = "Continuar";
    validateForm();
  }
});

document.getElementById("downloadButton").addEventListener("click", () => downloadCurrentPdf());
shareButton.addEventListener("click", async () => {
  try {
    await shareCurrentPdf();
  } catch (error) {
    if (error?.name !== "AbortError") alert("No se pudo compartir la cotización. Inténtalo nuevamente.");
  }
});

document.getElementById("completionHomeButton").addEventListener("click", () => {
  completionDialog.close();
  showView("home");
});

document.getElementById("completionEditButton").addEventListener("click", () => {
  completionDialog.close();
  showView(state.completionEditView);
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
    navigator.serviceWorker
      .register("/sw-v5.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => registration.update());
  });
}

initializeQuoteSerials();
resetForm();
