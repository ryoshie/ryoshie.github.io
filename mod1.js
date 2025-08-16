class EmbedPdf2 extends HTMLElement {
  static get observedAttributes() {
    return ["pdf"];
  }

  constructor() {
    super();
    this.readyPromise = new Promise(resolve => {
      this.resolveReady = resolve;
    });
  }

  // Triggered when the element has been attached to the regular DOM. We
  // can do important work after this point.
  connectedCallback() {
    // We resolve this promise here so that code elsewhere knows when it
    // can operate on the DOM.
    this.resolveReady();

    // Create our shadow DOM tree. Setting `mode` to `'open'` allows us to
    // access the shadow DOM from `this.shadowRoot`.
    this.attachShadow({ mode: "open" });

    // Assign our HTML structure and scoped styles.
    this.shadowRoot.innerHTML = `
      <style>
        canvas {
          box-shadow: 0 3px 6px #0004;
          border-radius: 6px;
        }
      </style>

      <canvas></canvas>
    `;
  }

  attributeChangedCallback(attr, oldVal, val) {
    if (attr === "pdf" && val !== null) {
      // Invoke PDF.js when we have been given a path. We ignore `null` for
      // when the attribute is removed.
      this.setPdf(val);
    }
  }

  async setPdf(path) {
    await this.readyPromise;
    const { pdfjsLib } = globalThis;
    if (!pdfjsLib) {
      throw new Error("PDF.js library is not loaded.");
    }
    if (!path) {
      throw new Error("No PDF path provided.");
    }
    // Load the PDF document.
    const pdfjs = pdfjsLib.getDocument({ url: path });
    if (!pdfjs) {
      throw new Error(`Failed to load PDF document from path: ${path}`);
    }
    // Wait for the PDF document to be loaded.
    const { pdfDocument } = await pdfjs.promise;
    if (!pdfDocument) {
      throw new Error(`Failed to load PDF document from path: ${path}`);
    }
    // Get the first page of the PDF document.
    if (!pdfDocument.getPage) {
      throw new Error(`PDF document does not have a getPage method: ${path}`);
    }
    const pdfPage = await pdfDocument.getPage(1);
    if (!pdfPage) {
      throw new Error(`
        Failed to get the first page of the PDF document: ${path}
      `);
    }
    // Get the viewport for the first page.
    const viewport = pdfPage.getViewport({ scale: 1 });
    if (!viewport) {
      throw new Error(`
        Failed to get viewport for the first page of the PDF document: ${path}
      `);
    }

    // We can simply query for the single `<canvas>` in our shadow DOM!
    const canvas = this.shadowRoot.querySelector("canvas");

    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderCtx = {
      canvasContext: ctx,
      viewport,
    };

    pdfPage.render(renderCtx);
  }
}

customElements.define("embed-pdf2", EmbedPdf2);

export { EmbedPdf2 };
