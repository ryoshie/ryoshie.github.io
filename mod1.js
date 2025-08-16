import { pdfjs } from "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/+esm";

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

    const pdf = await pdfjs.getDocument(path).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport(1);

    // We can simply query for the single `<canvas>` in our shadow DOM!
    const canvas = this.shadowRoot.querySelector("canvas");

    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderCtx = {
      canvasContext: ctx,
      viewport,
    };

    page.render(renderCtx);
  }
}

customElements.define("embed-pdf2", EmbedPdf2);

export { EmbedPdf2 };
