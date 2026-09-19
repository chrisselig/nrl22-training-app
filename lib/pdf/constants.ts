import type { PaperSize } from "../types";

export const PT_PER_IN = 72;
export const MM_PER_IN = 25.4;

export const PAGE_SIZES_IN: Record<PaperSize, { widthIn: number; heightIn: number }> = {
  letter: { widthIn: 8.5, heightIn: 11 },
  a4: { widthIn: 210 / MM_PER_IN, heightIn: 297 / MM_PER_IN },
};

export const MARGIN_IN = 0.5;
export const ITEM_GAP_IN = 0.3;
export const ROW_GAP_IN = 0.4;
/** Reserved at the top of every page when a global practice distance header is printed. */
export const HEADER_RESERVE_IN = 0.55;
/** Reserved below each shape's bounding box for its size/distance label. */
export const LABEL_RESERVE_IN = 0.26;

export const CENTER_DOT_RADIUS_IN = 0.02;
export const SHAPE_FONT_SIZE_PT = 8;
export const HEADER_FONT_SIZE_PT = 13;
