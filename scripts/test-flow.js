const http = require("http");
const fs = require("fs");
const path = require("path");

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(JSON.parse(body)));
      })
      .on("error", reject);
  });
}

async function main() {
  const cdpPort = process.env.CDP_PORT || "9223";
  const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
  const page = tabs.find((entry) => entry.type === "page");
  if (!page) throw new Error("No Chrome page target found");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const call = { id: ++id, method, params };
      pending.set(call.id, resolve);
      ws.send(JSON.stringify(call));
    });
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url: "http://localhost:4173/" });
  await new Promise((resolve) => setTimeout(resolve, 600));

  const expression = String.raw`
    (async () => {
      for (let i = 0; i < 50 && !window.PDFLib; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      document.querySelector("#newQuoteButton").click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const setValue = (selector, value) => {
        const element = document.querySelector(selector);
        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
      };
      setValue("#quoteDate", "2026-08-22");
      setValue("#clientName", "Cliente de Prueba");
      setValue("[data-field=description]", "Instalacion de camaras de seguridad");
      setValue("[data-field=quantity]", "2");
      setValue("[data-field=unitValue]", "150");
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 100;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fedd58";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#000000";
      context.fillRect(24, 20, 112, 60);
      context.fillStyle = "#ffffff";
      context.fillRect(34, 30, 92, 40);
      state.items[0].imageDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const enabledBeforeClick = !document.querySelector("#continueButton").disabled;
      document.querySelector("#continueButton").click();
      for (let i = 0; i < 80; i += 1) {
        const ready =
          document.querySelector("#previewView").classList.contains("active") &&
          document.querySelector("#pdfPreviewCanvas").width > 0;
        if (ready) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      localStorage.removeItem("hym_quote_history");
      const historyBeforeActions = JSON.parse(localStorage.getItem("hym_quote_history") || "[]").length;
      Object.defineProperty(navigator, "canShare", {
        value: () => true,
        configurable: true
      });
      Object.defineProperty(navigator, "share", {
        value: async (payload) => {
          window.__sharedFileName = payload.files[0].name;
        },
        configurable: true
      });
      await shareCurrentPdf();
      const historyAfterShare = JSON.parse(localStorage.getItem("hym_quote_history") || "[]");
      localStorage.removeItem("hym_quote_history");
      downloadCurrentPdf();
      const historyAfterDownload = JSON.parse(localStorage.getItem("hym_quote_history") || "[]");
      renderHistory();
      let binary = "";
      for (let i = 0; i < state.currentPdfBytes.length; i += 32768) {
        binary += String.fromCharCode(...state.currentPdfBytes.slice(i, i + 32768));
      }
      return {
        enabledBeforeClick,
        previewActive: document.querySelector("#previewView").classList.contains("active"),
        hasCanvasPreview: document.querySelector("#pdfPreviewCanvas").width > 0,
        historyBeforeActions,
        historyAfterShare: historyAfterShare.length,
        historyAfterDownload: historyAfterDownload.length,
        historyViewItems: document.querySelectorAll(".history-item").length,
        sharedFileName: window.__sharedFileName,
        savedImageInHistory: historyAfterDownload[0]?.items?.[0]?.imageDataUrl?.startsWith("data:image/") || false,
        totalText: document.querySelector("#grandTotal").textContent,
        pdfBase64: btoa(binary)
      };
    })()
  `;

  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  const value = result.result.result.value;
  if (value.pdfBase64) {
    const outputDir = path.join(process.cwd(), "tmp", "test-output");
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, "cotizacion-prueba.pdf"), Buffer.from(value.pdfBase64, "base64"));
    delete value.pdfBase64;
  }
  console.log(JSON.stringify(value, null, 2));
  ws.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
