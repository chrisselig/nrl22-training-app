export interface PackItem {
  id: string;
  widthIn: number;
  heightIn: number;
  /**
   * Consecutive items sharing the same group are kept together on one
   * page when they fit, and a labeled group reserves header space above
   * it (see PackOptions.groupHeaderReserveIn). Undefined items are also
   * grouped with their undefined neighbors, but since that's a no-op for
   * layout (no header, and the pre-block "keep together" check only ever
   * fires once at the very start when nothing's been placed yet), plain
   * unlabeled sessions pack identically to the pre-grouping algorithm.
   */
  group?: string;
}

export interface Placement extends PackItem {
  xIn: number;
  yIn: number;
  page: number;
}

/** Where to print a labeled group's header text, in the same top-down inch space as Placement. */
export interface GroupHeader {
  label: string;
  page: number;
  xIn: number;
  yIn: number;
  widthIn: number;
}

export interface PackOptions {
  pageWidthIn: number;
  pageHeightIn: number;
  marginIn: number;
  /** Vertical space reserved at the top of every page, e.g. for a practice-distance header. */
  headerReserveIn: number;
  itemGapIn: number;
  rowGapIn: number;
  /** Vertical space reserved above a labeled group's items for its header text. */
  groupHeaderReserveIn: number;
}

export interface PackResult {
  placements: Placement[];
  groupHeaders: GroupHeader[];
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

interface Block {
  group?: string;
  items: PackItem[];
}

function groupConsecutive(items: PackItem[]): Block[] {
  const blocks: Block[] = [];
  for (const item of items) {
    const last = blocks[blocks.length - 1];
    if (last && last.group === item.group) {
      last.items.push(item);
    } else {
      blocks.push({ group: item.group, items: [item] });
    }
  }
  return blocks;
}

/**
 * Dry-run of the same shelf/row wrapping rule the real packer uses below,
 * assuming an infinitely tall page — used only to decide whether a block
 * fits in the space remaining on the current page before committing to it.
 */
function measureBlockHeight(
  items: PackItem[],
  usableWidthIn: number,
  itemGapIn: number,
  rowGapIn: number,
): number {
  let cursorXIn = 0;
  let cursorYIn = 0;
  let rowHeightIn = 0;
  for (const item of items) {
    if (cursorXIn > 0 && cursorXIn + item.widthIn > usableWidthIn) {
      cursorXIn = 0;
      cursorYIn += rowHeightIn + rowGapIn;
      rowHeightIn = 0;
    }
    cursorXIn += item.widthIn + itemGapIn;
    rowHeightIn = Math.max(rowHeightIn, item.heightIn);
  }
  return cursorYIn + rowHeightIn;
}

/**
 * Shelf/row (next-fit) packing, preserving insertion order.
 *
 * Deliberately not a space-optimizing bin packer: general bin-packing
 * algorithms reorder and/or rotate items to minimize wasted space,
 * which would scramble course-of-fire stage order. This walks items in
 * order, placing each on the current row if it fits, wrapping to a new
 * row if it fits the page height, or starting a new page otherwise.
 *
 * Items are additionally grouped into blocks by their (optional) `group`
 * field: a labeled block is kept together on one page whenever it fits in
 * the space remaining there (jumping to a fresh page otherwise), and
 * reserves header space above it. A block larger than a full page is not
 * an error — it packs normally and overflows across as many pages as it
 * needs, same as any other oversized run of items.
 */
export function packItems(items: PackItem[], opts: PackOptions): PackResult {
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
  const groupHeaders: GroupHeader[] = [];
  let page = 0;
  let cursorYIn = 0;

  for (const block of groupConsecutive(items)) {
    const headerHeightIn = block.group ? opts.groupHeaderReserveIn : 0;
    const blockHeightIn =
      headerHeightIn +
      measureBlockHeight(
        block.items,
        usableWidthIn,
        opts.itemGapIn,
        opts.rowGapIn,
      );
    const remainingIn = usableHeightIn - cursorYIn;

    if (cursorYIn > 0 && blockHeightIn > remainingIn) {
      page += 1;
      cursorYIn = 0;
    }

    if (block.group) {
      groupHeaders.push({
        label: block.group,
        page,
        xIn: opts.marginIn,
        yIn: opts.marginIn + opts.headerReserveIn + cursorYIn,
        widthIn: usableWidthIn,
      });
      cursorYIn += headerHeightIn;
    }

    let cursorXIn = 0;
    let rowHeightIn = 0;

    for (const item of block.items) {
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

    cursorYIn += rowHeightIn + opts.rowGapIn;
  }

  return { placements, groupHeaders };
}

export function pageCount(placements: Placement[]): number {
  if (placements.length === 0) return 0;
  return Math.max(...placements.map((p) => p.page)) + 1;
}
