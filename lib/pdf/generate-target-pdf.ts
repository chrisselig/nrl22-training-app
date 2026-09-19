import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { HEADER_FONT_SIZE_PT, PT_PER_IN } from "./constants";
import { drawTarget } from "./shapes";
import { layoutSession } from "../target-layout";
import type { Session } from "../types";

const HEADER_COLOR = rgb(0.05, 0.05, 0.05);
const REMINDER_COLOR = rgb(0.35, 0.35, 0.35);
const REMINDER_TEXT = "Print at Actual Size / 100% — do not scale to fit page";

/** Throws packing.OversizedItemError if a target can't fit the page; callers should catch it. */
export async function buildTargetPdf(session: Session): Promise<Uint8Array> {
  const layout = layoutSession(session);

  const doc = await PDFDocument.create();
  doc.setTitle("NRL22 Practice Targets");
  doc.setProducer("NRL22 Target Printer");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidthPt = layout.pageWidthIn * PT_PER_IN;
  const pageHeightPt = layout.pageHeightIn * PT_PER_IN;

  const pages = Array.from({ length: Math.max(layout.pageCount, 1) }, () =>
    doc.addPage([pageWidthPt, pageHeightPt]),
  );

  for (const page of pages) {
    let y = pageHeightPt - HEADER_FONT_SIZE_PT - 10;

    if (session.globalPracticeDistance) {
      const distanceText = `Practice Distance: ${session.globalPracticeDistance.value} ${session.globalPracticeDistance.unit}`;
      const width = boldFont.widthOfTextAtSize(distanceText, HEADER_FONT_SIZE_PT);
      page.drawText(distanceText, {
        x: (pageWidthPt - width) / 2,
        y,
        size: HEADER_FONT_SIZE_PT,
        font: boldFont,
        color: HEADER_COLOR,
      });
      y -= HEADER_FONT_SIZE_PT + 2;
    }

    const reminderSize = HEADER_FONT_SIZE_PT - 3;
    const reminderWidth = font.widthOfTextAtSize(REMINDER_TEXT, reminderSize);
    page.drawText(REMINDER_TEXT, {
      x: (pageWidthPt - reminderWidth) / 2,
      y,
      size: reminderSize,
      font,
      color: REMINDER_COLOR,
    });
  }

  for (const item of layout.items) {
    const page = pages[item.placement.page];
    drawTarget(page, font, item, pageHeightPt);
  }

  return doc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
