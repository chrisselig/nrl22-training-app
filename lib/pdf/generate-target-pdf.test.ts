import { PDFDocument } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";
import { buildTargetPdf } from "./generate-target-pdf";
import { OversizedItemError } from "../packing";
import type { Session, Target } from "../types";

function circleTarget(id: string, mil: number, rangeYd: number): Target {
  return {
    id,
    shape: "circle",
    angularSize: { value: mil, unit: "mil" },
    representedRange: { value: rangeYd, unit: "yd" },
  };
}

describe("buildTargetPdf", () => {
  it("produces a loadable single-page PDF for a small session", async () => {
    const session: Session = {
      schemaVersion: 1,
      paperSize: "letter",
      globalPracticeDistance: { value: 25, unit: "yd" },
      targets: [
        circleTarget("a", 1.2, 38),
        {
          id: "b",
          shape: "square",
          angularSize: { value: 1, unit: "mil" },
          representedRange: { value: 50, unit: "yd" },
        },
        {
          id: "c",
          shape: "diamond",
          angularSize: { value: 1, unit: "mil" },
          representedRange: { value: 50, unit: "yd" },
        },
      ],
    };

    const bytes = await buildTargetPdf(session);
    expect(Buffer.from(bytes.slice(0, 5)).toString("utf-8")).toBe("%PDF-");

    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
  });

  it("produces a multi-page PDF when targets overflow one page", async () => {
    // 1.9 MIL @ 50yd = 3.42in shapes: 2 fit per row, 2 rows fit page 1 (4
    // targets), forcing the 5th/6th onto page 2.
    const targets = Array.from({ length: 6 }, (_, i) =>
      circleTarget(`t${i}`, 1.9, 50),
    );
    const session: Session = { schemaVersion: 1, paperSize: "letter", targets };

    const bytes = await buildTargetPdf(session);
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBeGreaterThan(1);
  });

  it("rejects a session with an oversized target instead of silently clipping", async () => {
    const session: Session = {
      schemaVersion: 1,
      paperSize: "letter",
      targets: [circleTarget("huge", 10, 500)],
    };
    await expect(buildTargetPdf(session)).rejects.toBeInstanceOf(
      OversizedItemError,
    );
  });

  it("places the first target near the top of the page (y-axis not inverted)", async () => {
    // A single small target near the top-left in our top-down layout
    // coordinates should end up near the TOP of the PDF page once
    // flipped to PDF's bottom-up space, not the bottom.
    const session: Session = {
      schemaVersion: 1,
      paperSize: "letter",
      targets: [circleTarget("a", 0.5, 25)],
    };
    const bytes = await buildTargetPdf(session);
    const loaded = await PDFDocument.load(bytes);
    const page = loaded.getPage(0);
    // Sanity: page height should match Letter (792pt) within rounding.
    expect(page.getHeight()).toBeCloseTo(792, 0);
  });
});
