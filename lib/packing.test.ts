import { describe, expect, it } from "vitest";
import { OversizedItemError, packItems, pageCount, type PackItem, type PackOptions } from "./packing";

const baseOpts: PackOptions = {
  pageWidthIn: 8.5,
  pageHeightIn: 11,
  marginIn: 0.5,
  headerReserveIn: 0,
  itemGapIn: 0.25,
  rowGapIn: 0.25,
};

function rectsOverlap(a: PackItem & { xIn: number; yIn: number }, b: PackItem & { xIn: number; yIn: number }) {
  const aRight = a.xIn + a.widthIn;
  const aBottom = a.yIn + a.heightIn;
  const bRight = b.xIn + b.widthIn;
  const bBottom = b.yIn + b.heightIn;
  return a.xIn < bRight && aRight > b.xIn && a.yIn < bBottom && aBottom > b.yIn;
}

describe("packItems", () => {
  it("places a single small item just inside the top-left margin", () => {
    const items: PackItem[] = [{ id: "a", widthIn: 2, heightIn: 2 }];
    const [placement] = packItems(items, baseOpts);
    expect(placement.xIn).toBe(0.5);
    expect(placement.yIn).toBe(0.5);
    expect(placement.page).toBe(0);
  });

  it("reserves header space at the top of the page", () => {
    const items: PackItem[] = [{ id: "a", widthIn: 2, heightIn: 2 }];
    const [placement] = packItems(items, { ...baseOpts, headerReserveIn: 1 });
    expect(placement.yIn).toBe(1.5);
  });

  it("wraps to a new row when an item doesn't fit the remaining row width", () => {
    // usable width = 8.5 - 1 = 7.5in. Two 4in-wide items can't share a row.
    const items: PackItem[] = [
      { id: "a", widthIn: 4, heightIn: 2 },
      { id: "b", widthIn: 4, heightIn: 2 },
    ];
    const placements = packItems(items, baseOpts);
    expect(placements[0].yIn).toBe(0.5);
    expect(placements[1].xIn).toBe(0.5);
    expect(placements[1].yIn).toBeCloseTo(0.5 + 2 + baseOpts.rowGapIn, 5);
    expect(placements[0].page).toBe(0);
    expect(placements[1].page).toBe(0);
  });

  it("wraps to a new page when an item doesn't fit the remaining page height", () => {
    // usable height = 11 - 1 = 10in. Three 4in-tall single-column items overflow one page.
    const items: PackItem[] = [
      { id: "a", widthIn: 7, heightIn: 4 },
      { id: "b", widthIn: 7, heightIn: 4 },
      { id: "c", widthIn: 7, heightIn: 4 },
    ];
    const placements = packItems(items, baseOpts);
    expect(placements[0].page).toBe(0);
    expect(placements[1].page).toBe(0);
    expect(placements[2].page).toBe(1);
    expect(placements[2].yIn).toBe(0.5);
  });

  it("preserves insertion order across rows and pages", () => {
    const items: PackItem[] = Array.from({ length: 9 }, (_, i) => ({
      id: `item-${i}`,
      widthIn: 3,
      heightIn: 3,
    }));
    const placements = packItems(items, baseOpts);
    expect(placements.map((p) => p.id)).toEqual(items.map((i) => i.id));

    for (let i = 1; i < placements.length; i++) {
      const prev = placements[i - 1];
      const curr = placements[i];
      expect(curr.page).toBeGreaterThanOrEqual(prev.page);
      if (curr.page === prev.page && curr.yIn === prev.yIn) {
        expect(curr.xIn).toBeGreaterThan(prev.xIn);
      }
    }
  });

  it("never overlaps placements on the same page", () => {
    const items: PackItem[] = Array.from({ length: 12 }, (_, i) => ({
      id: `item-${i}`,
      widthIn: 1.5 + (i % 3) * 0.5,
      heightIn: 1.5 + (i % 2) * 0.7,
    }));
    const placements = packItems(items, baseOpts);

    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        if (placements[i].page !== placements[j].page) continue;
        expect(rectsOverlap(placements[i], placements[j])).toBe(false);
      }
    }
  });

  it("throws OversizedItemError when an item exceeds the usable page area", () => {
    const items: PackItem[] = [{ id: "huge", widthIn: 20, heightIn: 2 }];
    expect(() => packItems(items, baseOpts)).toThrow(OversizedItemError);
  });

  it("throws when margins/header leave no usable area", () => {
    const items: PackItem[] = [{ id: "a", widthIn: 1, heightIn: 1 }];
    expect(() => packItems(items, { ...baseOpts, marginIn: 5 })).toThrow();
  });

  it("returns an empty array for an empty item list", () => {
    expect(packItems([], baseOpts)).toEqual([]);
  });
});

describe("pageCount", () => {
  it("returns 0 for no placements", () => {
    expect(pageCount([])).toBe(0);
  });

  it("counts the highest page index + 1", () => {
    const items: PackItem[] = [
      { id: "a", widthIn: 7, heightIn: 4 },
      { id: "b", widthIn: 7, heightIn: 4 },
      { id: "c", widthIn: 7, heightIn: 4 },
    ];
    const placements = packItems(items, baseOpts);
    expect(pageCount(placements)).toBe(2);
  });
});
