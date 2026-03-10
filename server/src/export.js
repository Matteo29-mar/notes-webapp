import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
} from "docx";
import { JSDOM } from "jsdom";

export async function htmlToDocxBuffer(html) {
  const dom = new JSDOM(html);
  const body = dom.window.document.body;

  const children = [];

  // TreeWalker: prende testo + IMG ovunque (anche dentro <p>)
  const walker = dom.window.document.createTreeWalker(
    body,
    dom.window.NodeFilter.SHOW_ELEMENT | dom.window.NodeFilter.SHOW_TEXT
  );

  let node;
  while ((node = walker.nextNode())) {
    // TESTO
    if (node.nodeType === 3) {
      const text = node.textContent?.replace(/\s+/g, " ").trim();
      if (text) {
        children.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
      }
      continue;
    }

    // IMMAGINI
    if (node.nodeType === 1 && node.tagName === "IMG") {
      const src = node.getAttribute("src") || "";

      if (src.startsWith("data:image")) {
        const base64 = src.split(",")[1];
        if (!base64) continue;

        const buffer = Buffer.from(base64, "base64");

        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: buffer,
                transformation: {
                  width: 420,
                  height: 300,
                },
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    creator: "Notes Web App",
    title: "Nota esportata",
    description: "Documento generato automaticamente",
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

export function htmlToPlainText(html) {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
}

export function containsImages(html) {
  return /<img\s/i.test(html);
}
