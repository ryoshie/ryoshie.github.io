const style = `
:host {
  display: block;
  width: 100vw;
  height: 100vh;
  background-color: #ddd;
}
iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.download-link {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.download-link a {
  background-color: royalblue;
  color: white;
  border-radius: 0.5em;
  padding: 1em;
  text-decoration: none;
  line-height: 100%;
}
.download-link a:hover {
  background-color: dodgerblue;
}
.download-link a::after {
  content: "💾";
  font-size: 1.2em;
  mergin: 0.2em;
  filter: brightness(2);
}
#editorModeButtons, #editorModeSeparator {
  display: none;
}
`;

const body = document.body;
body.style.width = "100vw";
body.style.height = "100vh";
body.style.margin = "0";
body.style.padding = "0";
body.style.overflow = "hidden";

/** @type {Record<string, Promise<string>>} */
const viewerHtmlCache = {};

/** @param {{ src: string | null }} options */
async function render({ src: fileSrc }) {
  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.allowFullscreen = true;

  if (!fileSrc) {
    throw new Error("plese set `src` attribute to <embed-pdf> element.");
  }

  try {
    const fileUrl = new URL(fileSrc, location.href);
    console.log("EmbedPdf: fileUrl", fileUrl);

    // cache pdfjs content
    viewerHtmlCache[EmbedPdf.viewerUrl] ??= (async () => {
      const res = await fetch(EmbedPdf.viewerUrl);
      return res.text();
    })();
    const text = await viewerHtmlCache[EmbedPdf.viewerUrl];

    // inject script tag
    const html = text
      .replace(
        '<meta charset="utf-8">',
        `<meta charset="utf-8"><base href="${EmbedPdf.viewerUrl}">`
      )
      .replace(
        '<script src="viewer.js"></script>',
        `<script src="viewer.js"></script>
        <script>PDFViewerApplicationOptions.set("defaultUrl", "${fileUrl}");</script>`
      );

    const blob = new Blob([html], { type: "text/html" });
    iframe.src = URL.createObjectURL(blob);

    // show download link when loading error occurs
    iframe.addEventListener("load", () => {
      iframe.contentWindow?.addEventListener("unhandledrejection", () => {
        iframe.parentNode?.append(renderDownloadLink(fileSrc));
        iframe.remove();
      });
    });

    return iframe;
  } catch (error) {
    console.error(error);

    return renderDownloadLink(fileSrc);
  }
}

/** @param {string} fileSrc */
function renderDownloadLink(fileSrc) {
  // if error, show download link.
  const wrapper = document.createElement("div");
  const downloadLink = document.createElement("a");
  downloadLink.href = fileSrc;
  downloadLink.target = "_brank";
  downloadLink.textContent = "Download PDF";
  wrapper.append(downloadLink);
  wrapper.classList.add("download-link");
  return wrapper;
}

class EmbedPdf extends HTMLElement {
  static viewerUrl = new URL(
    "https://mozilla.github.io/pdf.js/web/viewer.html",
    import.meta.url
  ).toString();

  static observedAttributes = ["src"];

  #shadowRoot;

  #isConnected = false;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "closed" });
    const styleSheet = new CSSStyleSheet();
    styleSheet.replace(style);
    console.log("EmbedPdf: viewerUrl", EmbedPdf.viewerUrl);
    this.#shadowRoot.adoptedStyleSheets = [styleSheet];
  }

  async connectedCallback() {
    this.#shadowRoot.replaceChildren(
      await render({ src: this.getAttribute("src") })
    );
    this.#isConnected = true;
  }

  disconnectedCallback() {
    this.#isConnected = false;
    this.#shadowRoot.replaceChildren();
  }

  /**
   * @param {string} name
   * @param {string | null} _oldValue
   * @param {string | null} newValue
   */
  async attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.#isConnected) {
      return;
    }
    if (name === "src") {
      this.#shadowRoot.replaceChildren(await render({ src: newValue }));
    }
  }
}

customElements.define("embed-pdf", EmbedPdf);

export { EmbedPdf };
