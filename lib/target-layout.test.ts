import { describe, expect, it } from "vitest";
import { layoutSession } from "./target-layout";
import { OversizedItemError } from "./packing";
import type { Session, Target } from "./types";

function circleTarget(id: string, mil: number, rangeYd: number): Target {
  return {
    id,
    shape: "circle",
    angularSize: { value: mil, unit: "mil" },
    representedRange: { value: rangeYd, unit: "yd" },
  };
}

describe("layoutSession", () => {
  it("returns no pages for an empty session", () => {
    const session: Session = {
      schemaVersion: 1,
      paperSize: "letter",
      targets: [],
    };
    const layout = layoutSession(session);
    expect(layout.items).toEqual([]);
    expect(layout.pageCount).toBe(0);
  });

  it("scales targets by the global practice distance, not their represented range", () => {
    const session: Session = {
      schemaVersion: 1,
      paperSize: "letter",
      globalPracticeDistance: { value: 25, unit: "yd" },
      targets: [circleTarget("a", 1.2, 38)],
    };
    const layout = layoutSession(session);
    expect(layout.items[0].shapeWidthIn).toBeCloseTo(1.08, 4);
  });

  it("reserves header space on every page regardless of practice distance", () => {
    const withDistance = layoutSession({
      schemaVersion: 1,
      paperSize: "letter",
      globalPracticeDistance: { value: 25, unit: "yd" },
      targets: [circleTarget("a", 1, 25)],
    });
    const withoutDistance = layoutSession({
      schemaVersion: 1,
      paperSize: "letter",
      targets: [circleTarget("a", 1, 25)],
    });
    expect(withDistance.headerReserveIn).toBeGreaterThan(0);
    expect(withoutDistance.headerReserveIn).toBe(withDistance.headerReserveIn);
  });

  it("packs many small targets onto a single page", () => {
    const targets = Array.from({ length: 6 }, (_, i) =>
      circleTarget(`t${i}`, 0.5, 25),
    );
    const layout = layoutSession({
      schemaVersion: 1,
      paperSize: "letter",
      targets,
    });
    expect(layout.pageCount).toBe(1);
    expect(layout.items).toHaveLength(6);
  });

  it("overflows to a second page when targets don't fit one", () => {
    // 1.9 MIL @ 50yd = 3.42in shapes: 2 fit per row, 2 rows fit page 1 (4
    // targets), forcing the 5th/6th onto page 2. Large enough to force
    // wrapping but still well under the single-item OversizedItemError limit.
    const targets = Array.from({ length: 6 }, (_, i) =>
      circleTarget(`t${i}`, 1.9, 50),
    );
    const layout = layoutSession({
      schemaVersion: 1,
      paperSize: "letter",
      targets,
    });
    expect(layout.pageCount).toBeGreaterThan(1);
  });

  it("throws OversizedItemError for a target too large for the page", () => {
    const session: Session = {
      schemaVersion: 1,
      paperSize: "letter",
      targets: [circleTarget("huge", 10, 500)],
    };
    expect(() => layoutSession(session)).toThrow(OversizedItemError);
  });

  it("uses A4 page dimensions when selected", () => {
    const letter = layoutSession({
      schemaVersion: 1,
      paperSize: "letter",
      targets: [],
    });
    const a4 = layoutSession({
      schemaVersion: 1,
      paperSize: "a4",
      targets: [],
    });
    expect(a4.pageWidthIn).not.toBeCloseTo(letter.pageWidthIn, 2);
  });
});
