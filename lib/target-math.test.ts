import { describe, expect, it } from "vitest";
import {
  IN_PER_YD_PER_MIL,
  angularToInches,
  computeTargetPrintSize,
  effectivePrintDistance,
  formatLabel,
  toYards,
} from "./target-math";
import type { Target } from "./types";

describe("does not use the NATO 6400-mil constant", () => {
  it("uses the milliradian constant (3.6in/100yd), not NATO angular mil (~3.53in/100yd)", () => {
    expect(IN_PER_YD_PER_MIL).toBeCloseTo(0.036, 10);
  });
});

describe("toYards", () => {
  it("passes yards through unchanged", () => {
    expect(toYards({ value: 38, unit: "yd" })).toBe(38);
  });

  it("converts meters to yards", () => {
    expect(toYards({ value: 50, unit: "m" })).toBeCloseTo(54.68065, 4);
  });

  it("rejects non-positive distances", () => {
    expect(() => toYards({ value: 0, unit: "yd" })).toThrow();
    expect(() => toYards({ value: -5, unit: "yd" })).toThrow();
  });
});

describe("angularToInches (verified against reference screenshot + NSSF/Everyday Marksman)", () => {
  it("matches the screenshot: 38yd range, 1.2 MIL -> 1.642in print diameter", () => {
    expect(angularToInches({ value: 1.2, unit: "mil" }, 38)).toBeCloseTo(1.6416, 4);
  });

  it("matches the screenshot: 1.2 MIL scaled to a 25yd practice distance -> 1.080in", () => {
    expect(angularToInches({ value: 1.2, unit: "mil" }, 25)).toBeCloseTo(1.08, 4);
  });

  it("matches the screenshot: 38yd range, 1.2 MIL == 4.13 MOA (cross-check)", () => {
    const milInches = angularToInches({ value: 1.2, unit: "mil" }, 38);
    const moaInches = angularToInches({ value: 4.13, unit: "moa" }, 38);
    expect(moaInches).toBeCloseTo(milInches, 2);
  });

  it("1 MIL at 100yd is exactly 3.6 inches", () => {
    expect(angularToInches({ value: 1, unit: "mil" }, 100)).toBeCloseTo(3.6, 10);
  });

  it("1 true MOA at 100yd is exactly 1.047 inches", () => {
    expect(angularToInches({ value: 1, unit: "moa" }, 100)).toBeCloseTo(1.047, 10);
  });

  it("rejects non-positive angular size or range", () => {
    expect(() => angularToInches({ value: 0, unit: "mil" }, 38)).toThrow();
    expect(() => angularToInches({ value: 1, unit: "mil" }, 0)).toThrow();
  });
});

describe("effectivePrintDistance", () => {
  const base: Target = {
    id: "t1",
    shape: "circle",
    angularSize: { value: 1, unit: "mil" },
    representedRange: { value: 38, unit: "yd" },
  };

  it("falls back to representedRange when nothing else is set", () => {
    expect(effectivePrintDistance(base)).toEqual({ value: 38, unit: "yd" });
  });

  it("prefers the global practice distance over representedRange", () => {
    expect(effectivePrintDistance(base, { value: 25, unit: "yd" })).toEqual({
      value: 25,
      unit: "yd",
    });
  });

  it("prefers a per-target override over the global practice distance", () => {
    const target: Target = { ...base, overrideDistance: { value: 15, unit: "yd" } };
    expect(effectivePrintDistance(target, { value: 25, unit: "yd" })).toEqual({
      value: 15,
      unit: "yd",
    });
  });
});

describe("computeTargetPrintSize", () => {
  it("computes a square bbox for circle/square/diamond from one angular value", () => {
    const target: Target = {
      id: "t1",
      shape: "diamond",
      angularSize: { value: 1.2, unit: "mil" },
      representedRange: { value: 38, unit: "yd" },
    };
    const size = computeTargetPrintSize(target);
    expect(size.widthIn).toBeCloseTo(1.6416, 4);
    expect(size.heightIn).toBeCloseTo(1.6416, 4);
  });

  it("computes independent width/height for a rectangle", () => {
    const target: Target = {
      id: "t1",
      shape: "rectangle",
      angularWidth: { value: 2, unit: "mil" },
      angularHeight: { value: 1, unit: "mil" },
      representedRange: { value: 100, unit: "yd" },
    };
    const size = computeTargetPrintSize(target);
    expect(size.widthIn).toBeCloseTo(7.2, 4);
    expect(size.heightIn).toBeCloseTo(3.6, 4);
  });

  it("scales down using the global practice distance instead of the represented range", () => {
    const target: Target = {
      id: "t1",
      shape: "circle",
      angularSize: { value: 1.2, unit: "mil" },
      representedRange: { value: 38, unit: "yd" },
    };
    const size = computeTargetPrintSize(target, { value: 25, unit: "yd" });
    expect(size.widthIn).toBeCloseTo(1.08, 4);
  });
});

describe("formatLabel", () => {
  it("formats a circle/square/diamond label", () => {
    const target: Target = {
      id: "t1",
      shape: "circle",
      angularSize: { value: 1.2, unit: "mil" },
      representedRange: { value: 38, unit: "yd" },
    };
    expect(formatLabel(target)).toBe("1.2 MIL · 38 yd");
  });

  it("formats a rectangle label with both dimensions", () => {
    const target: Target = {
      id: "t1",
      shape: "rectangle",
      angularWidth: { value: 2, unit: "mil" },
      angularHeight: { value: 1, unit: "mil" },
      representedRange: { value: 100, unit: "yd" },
    };
    expect(formatLabel(target)).toBe("2 MIL x 1 MIL · 100 yd");
  });
});
