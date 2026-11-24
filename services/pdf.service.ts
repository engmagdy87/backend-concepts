import PDFDocument from "pdfkit";
import type { Writable } from "node:stream";
import type CartItem from "../models/cart-item.model";

/** 19.5 → "19.50" */
function money(value: number): string {
  return value.toFixed(2);
}

/**
 * Writes a cart quote PDF into `out` (for example the HTTP response).
 * Streaming: PDFKit sends each piece as soon as it's ready, so the whole
 * PDF is never kept in memory and nothing is saved to disk.
 */
export function writeCartQuotePdf(items: CartItem[], out: Writable): void {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(out); // everything written to `doc` from now on flows into `out`

  doc.fontSize(22).text("Quote", { underline: true });
  doc.moveDown(0.5);
  // "en-CA" gives YYYY-MM-DD in the server's local time zone
  doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString("en-CA")}`);
  doc.moveDown();

  let total = 0;
  doc.fontSize(12);
  for (const item of items) {
    const lineTotal = item.product.price * item.quantity;
    total += lineTotal;
    doc.text(
      `${item.product.title}  -  ${item.quantity} x ${money(item.product.price)} = ${money(lineTotal)}`,
    );
  }

  doc.moveDown();
  doc.fontSize(14).text(`Total: ${money(total)}`);

  doc.end(); // finishes the PDF, which also ends `out` (the response)
}
