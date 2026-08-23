const TEMPLATE_URL = "assets/cotizacion-hym.pdf";
const HISTORY_KEY = "hym_quote_history";
const MAX_ITEMS_IN_TEMPLATE = 8;
const MAX_ITEM_IMAGE_SIZE = 700;

const state = {
  currentPdfUrl: "",
  currentPdfBytes: null,
  currentQuote: null,
  items: []
};

const views = {
  home: document.getElementById("homeView"),
  form: document.getElementById("formView"),
  preview: document.getElementById("previewView"),
  history: document.getElementById("historyView")
};

const form = document.getElementById("quoteForm");
const quoteDate = document.getElementById("quoteDate");
const clientName = document.getElementById("clientName");
const itemsList = document.getElementById("itemsList");
const grandTotal = document.getElementById("grandTotal");
const continueButton = document.getElementById("continueButton");
const pdfPreview = document.getElementById("pdfPreview");
const historyList = document.getElementById("historyList");
const shareButton = document.getElementById("shareButton");

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

async function generatePdf(quote) {
  const templateBytes = await fetch(TEMPLATE_URL).then((response) => response.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
  const regularFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];

  drawText(page, formatDisplayDate(quote.date), {
    x: 60,
    y: 664,
    size: 11,
    font: regularFont
  });
  drawText(page, quote.clientName, {
    x: 80,
    y: 620,
    size: 12,
    font: boldFont
  });

  let rowY = 430;
  for (const [index, item] of quote.items.slice(0, MAX_ITEMS_IN_TEMPLATE).entries()) {
    const descriptionLines = wrapText(item.description, regularFont, 9, 190).slice(0, 3);
    drawText(page, String(index + 1), { x: 46, y: rowY, size: 10, font: boldFont });
    if (item.imageDataUrl) {
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
    descriptionLines.forEach((line, lineIndex) => {
      drawText(page, line, {
        x: 164,
        y: rowY - lineIndex * 11,
        size: 9,
        font: regularFont
      });
    });
    drawRight(page, item.quantity, 360, rowY, 45, 10, regularFont);
    drawRight(page, toMoney(item.unitValue), 420, rowY, 56, 10, regularFont);
    drawRight(page, toMoney(item.total), 493, rowY, 65, 10, boldFont);
    rowY -= 24;
  }

  drawRight(page, toMoney(quote.total), 493, 233, 65, 13, boldFont);
  return pdfDoc.save();
}

function setPdfPreview(bytes, quote) {
  if (state.currentPdfUrl) URL.revokeObjectURL(state.currentPdfUrl);
  const blob = new Blob([bytes], { type: "application/pdf" });
  state.currentPdfUrl = URL.createObjectURL(blob);
  state.currentPdfBytes = bytes;
  state.currentQuote = quote;
  pdfPreview.src = state.currentPdfUrl;
}

function saveQuoteToHistory(quote) {
  const history = readHistory().filter((entry) => entry.id !== quote.id);
  history.unshift({
    id: quote.id,
    date: quote.date,
    clientName: quote.clientName,
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
      <button class="small-button" type="button" data-open-history="${quote.id}">Ver PDF</button>
    `;
    historyList.appendChild(item);
  });
}

async function openHistoryQuote(id) {
  const quote = readHistory().find((entry) => entry.id === id);
  if (!quote) return;
  const bytes = await generatePdf(quote);
  setPdfPreview(bytes, quote);
  showView("preview");
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
  state.items = [];
  createItem();
}

document.getElementById("newQuoteButton").addEventListener("click", () => {
  resetForm();
  showView("form");
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
  const id = event.target.dataset.openHistory;
  if (id) openHistoryQuote(id);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw-v5.js", { scope: "/" });
  });
}

resetForm();
