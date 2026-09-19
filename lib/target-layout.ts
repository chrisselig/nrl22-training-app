import { packItems, pageCount, type Placement, type PackOptions } from "./packing";
import { computeTargetPrintSize } from "./target-math";
import {
  HEADER_RESERVE_IN,
  ITEM_GAP_IN,
  LABEL_RESERVE_IN,
  MARGIN_IN,
  PAGE_SIZES_IN,
  ROW_GAP_IN,
} from "./pdf/constants";
import type { Session, Target } from "./types";

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
  };

  const placements = packItems(
    sized.map((s) => ({
      id: s.target.id,
      widthIn: s.shapeWidthIn,
      heightIn: s.shapeHeightIn + LABEL_RESERVE_IN,
    })),
    packOptions,
  );

  const sizedById = new Map(sized.map((s) => [s.target.id, s]));
  const items: LaidOutTarget[] = placements.map((placement) => {
    const s = sizedById.get(placement.id);
    if (!s) throw new Error(`No sized target found for placement id "${placement.id}"`);
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
    pageCount: pageCount(placements),
  };
}
