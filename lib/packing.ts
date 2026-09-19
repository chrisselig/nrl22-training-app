export interface PackItem {
  id: string;
  widthIn: number;
  heightIn: number;
}

export interface Placement extends PackItem {
  xIn: number;
  yIn: number;
  page: number;
}

export interface PackOptions {
  pageWidthIn: number;
  pageHeightIn: number;
  marginIn: number;
  /** Vertical space reserved at the top of every page, e.g. for a practice-distance header. */
  headerReserveIn: number;
  itemGapIn: number;
  rowGapIn: number;
}

export class OversizedItemError extends Error {
  constructor(
    public readonly item: PackItem,
    public readonly usableWidthIn: number,
    public readonly usableHeightIn: number,
  ) {
    super(
      `Target "${item.id}" (${item.widthIn.toFixed(2)}in x ${item.heightIn.toFixed(2)}in) ` +
        `is larger than the printable area (${usableWidthIn.toFixed(2)}in x ${usableHeightIn.toFixed(2)}in). ` +
        "Choose a shorter practice distance or a smaller angular size.",
    );
    this.name = "OversizedItemError";
  }
}

/**
 * Shelf/row (next-fit) packing, preserving insertion order.
 *
 * Deliberately not a space-optimizing bin packer: general bin-packing
 * algorithms reorder and/or rotate items to minimize wasted space,
 * which would scramble course-of-fire stage order. This walks items in
 * order, placing each on the current row if it fits, wrapping to a new
 * row if it fits the page height, or starting a new page otherwise.
 */
export function packItems(items: PackItem[], opts: PackOptions): Placement[] {
  const usableWidthIn = opts.pageWidthIn - 2 * opts.marginIn;
  const usableHeightIn =
    opts.pageHeightIn - 2 * opts.marginIn - opts.headerReserveIn;

  if (usableWidthIn <= 0 || usableHeightIn <= 0) {
    throw new Error(
      "Page margins and header reserve leave no usable printable area.",
    );
  }

  for (const item of items) {
    if (item.widthIn > usableWidthIn || item.heightIn > usableHeightIn) {
      throw new OversizedItemError(item, usableWidthIn, usableHeightIn);
    }
  }

  const placements: Placement[] = [];
  let page = 0;
  let cursorXIn = 0;
  let cursorYIn = 0;
  let rowHeightIn = 0;

  for (const item of items) {
    if (cursorXIn > 0 && cursorXIn + item.widthIn > usableWidthIn) {
      cursorXIn = 0;
      cursorYIn += rowHeightIn + opts.rowGapIn;
      rowHeightIn = 0;
    }

    if (cursorYIn + item.heightIn > usableHeightIn) {
      page += 1;
      cursorXIn = 0;
      cursorYIn = 0;
      rowHeightIn = 0;
    }

    placements.push({
      ...item,
      xIn: opts.marginIn + cursorXIn,
      yIn: opts.marginIn + opts.headerReserveIn + cursorYIn,
      page,
    });

    cursorXIn += item.widthIn + opts.itemGapIn;
    rowHeightIn = Math.max(rowHeightIn, item.heightIn);
  }

  return placements;
}

export function pageCount(placements: Placement[]): number {
  if (placements.length === 0) return 0;
  return Math.max(...placements.map((p) => p.page)) + 1;
}
