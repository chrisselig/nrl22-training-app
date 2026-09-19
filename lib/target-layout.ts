import {
  packItems,
  pageCount,
  type GroupHeader,
  type Placement,
  type PackOptions,
} from "./packing";
import { computeTargetPrintSize, formatLabel } from "./target-math";
import {
  HEADER_RESERVE_IN,
  ITEM_GAP_IN,
  LABEL_RESERVE_IN,
  MARGIN_IN,
  PAGE_SIZES_IN,
  PT_PER_IN,
  ROW_GAP_IN,
  SHAPE_FONT_SIZE_PT,
  STAGE_HEADER_RESERVE_IN,
} from "./pdf/constants";
import type { Session, Target } from "./types";

/**
 * layoutSession() is synchronous and shared with the browser SVG preview,
 * which has no access to pdf-lib's embedded-font metrics, so the label's
 * printed width can't be measured exactly here. This deliberately
 * overestimates Helvetica's real average glyph width for this label
 * character set (digits/letters/·/space) — a looser pack is fine, but an
 * underestimate would let two labels visually overlap on the page.
 */
const AVG_LABEL_CHAR_WIDTH_EM = 0.6;

function estimateLabelWidthIn(target: Target): number {
  const label = formatLabel(target);
  const widthPt = label.length * SHAPE_FONT_SIZE_PT * AVG_LABEL_CHAR_WIDTH_EM;
  return widthPt / PT_PER_IN;
}

export interface LaidOutTarget {
  target: Target;
  placement: Placement;
  shapeWidthIn: number;
  shapeHeightIn: number;
}

export interface SessionLayout {
  pageWidthIn: number;
  pageHeightIn: number;
  headerReserveIn: number;
  items: LaidOutTarget[];
  /** Print positions for each labeled stage's header, one entry per stage block. */
  stageHeaders: GroupHeader[];
  pageCount: number;
}

/**
 * Single source of truth for turning a Session into laid-out pages,
 * shared by the on-screen preview and the PDF exporter so they can
 * never drift apart.
 */
export function layoutSession(session: Session): SessionLayout {
  const page = PAGE_SIZES_IN[session.paperSize];
  // Always reserved, even without a practice distance: every page carries a
  // "print at Actual Size / 100%" reminder, since browsers/printers silently
  // rescaling the page is the single biggest threat to real-world accuracy.
  const headerReserveIn = HEADER_RESERVE_IN;

  const sized = session.targets.map((target) => {
    const size = computeTargetPrintSize(target, session.globalPracticeDistance);
    return { target, shapeWidthIn: size.widthIn, shapeHeightIn: size.heightIn };
  });

  const packOptions: PackOptions = {
    pageWidthIn: page.widthIn,
    pageHeightIn: page.heightIn,
    marginIn: MARGIN_IN,
    headerReserveIn,
    itemGapIn: ITEM_GAP_IN,
    rowGapIn: ROW_GAP_IN,
    groupHeaderReserveIn: STAGE_HEADER_RESERVE_IN,
  };

  const { placements, groupHeaders } = packItems(
    sized.map((s) => ({
      id: s.target.id,
      // The packed box must be wide enough for the label text too, not
      // just the shape — small/scaled-down targets routinely have a label
      // wider than the shape itself (see estimateLabelWidthIn above).
      widthIn: Math.max(s.shapeWidthIn, estimateLabelWidthIn(s.target)),
      heightIn: s.shapeHeightIn + LABEL_RESERVE_IN,
      group: s.target.stage?.trim() || undefined,
    })),
    packOptions,
  );

  const sizedById = new Map(sized.map((s) => [s.target.id, s]));
  const items: LaidOutTarget[] = placements.map((placement) => {
    const s = sizedById.get(placement.id);
    if (!s)
      throw new Error(
        `No sized target found for placement id "${placement.id}"`,
      );
    return {
      target: s.target,
      placement,
      shapeWidthIn: s.shapeWidthIn,
      shapeHeightIn: s.shapeHeightIn,
    };
  });

  return {
    pageWidthIn: page.widthIn,
    pageHeightIn: page.heightIn,
    headerReserveIn,
    items,
    stageHeaders: groupHeaders,
    pageCount: pageCount(placements),
  };
}
