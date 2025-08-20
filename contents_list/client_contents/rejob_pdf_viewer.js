const vendorUrl = "https://ryoshie.github.io/web/viewer.html";
const pdfUrl = document.body.dataset.pdfUrl;
const title = document.body.dataset.title || "PDF Viewer";
// URLのハッシュを取得
const hash = document.location.hash || "";
const iframe = document.createElement("iframe");
iframe.allowfullscreen = true;
iframe.src = vendorUrl + "?file=" + encodeURIComponent(pdfUrl) + hash;
iframe.onload = () => {
  if (document.readyState !== "complete") {
    window.stop(); // Safariで下のバーを消すトリガー
  }
};
document.body.append(iframe);
document.title = title;
