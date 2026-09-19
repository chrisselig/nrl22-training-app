import { rgb, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";
import {
  CENTER_DOT_RADIUS_IN,
  PT_PER_IN,
  SHAPE_FONT_SIZE_PT,
  STAGE_HEADER_FONT_SIZE_PT,
  STAGE_HEADER_RESERVE_IN,
} from "./constants";
import { formatLabel } from "../target-math";
import type { LaidOutTarget } from "../target-layout";
import type { GroupHeader } from "../packing";

const STROKE_COLOR = rgb(0.1, 0.1, 0.1);
const STROKE_WIDTH_PT = 1.5;
const TEXT_COLOR = rgb(0.15, 0.15, 0.15);
const STAGE_HEADER_COLOR = rgb(0.05, 0.05, 0.05);

/**
 * placement.yIn (and any other top-down inch offset in this module) is
 * measured from the page's top edge, matching lib/packing.ts and the
 * on-screen preview; PDF space is bottom-up. This is the one shared flip
 * formula — every other geometry calculation downstream must call this
 * rather than re-deriving the flip inline, so there's only ever one place
 * that can get the sign wrong.
 */
function flipTopDownYToPdfPt(
  topYIn: number,
  heightIn: number,
  pageHeightPt: number,
): number {
  return pageHeightPt - topYIn * PT_PER_IN - heightIn * PT_PER_IN;
}

interface ShapeGeometry {
  xPt: number;
  bottomYPt: number;
  widthPt: number;
  heightPt: number;
  cxPt: number;
  cyPt: number;
}

/**
 * placement.widthIn is the packed box width, which may be wider than the
 * shape itself when the label text is wider than the shape (see
 * estimateLabelWidthIn in target-layout.ts) — the shape is centered
 * horizontally within that box so the label centers under it correctly.
 */
function shapeGeometryPt(
  item: LaidOutTarget,
  pageHeightPt: number,
): ShapeGeometry {
  const widthPt = item.shapeWidthIn * PT_PER_IN;
  const heightPt = item.shapeHeightIn * PT_PER_IN;
  const boxWidthPt = item.placement.widthIn * PT_PER_IN;
  const xPt = item.placement.xIn * PT_PER_IN + (boxWidthPt - widthPt) / 2;
  const bottomYPt = flipTopDownYToPdfPt(
    item.placement.yIn,
    item.shapeHeightIn,
    pageHeightPt,
  );
  return {
    xPt,
    bottomYPt,
    widthPt,
    heightPt,
    cxPt: xPt + widthPt / 2,
    cyPt: bottomYPt + heightPt / 2,
  };
}

/**
 * Diamond is drawn as four discrete drawLine() segments rather than an
 * SVG path. pdf-lib/@cantoo's drawSvgPath has a documented, contested
 * y-axis flip behavior (see Hopding/pdf-lib#822/#823) that's easy to get
 * backwards; drawLine's start/end points are plain, unambiguous PDF
 * coordinates, so this sidesteps that footgun entirely.
 */
function drawDiamond(page: PDFPage, geo: ShapeGeometry): void {
  const top = { x: geo.cxPt, y: geo.bottomYPt + geo.heightPt };
  const right = { x: geo.xPt + geo.widthPt, y: geo.cyPt };
  const bottom = { x: geo.cxPt, y: geo.bottomYPt };
  const left = { x: geo.xPt, y: geo.cyPt };

  for (const [start, end] of [
    [top, right],
    [right, bottom],
    [bottom, left],
    [left, top],
  ] as const) {
    page.drawLine({
      start,
      end,
      thickness: STROKE_WIDTH_PT,
      color: STROKE_COLOR,
    });
  }
}

export function drawTarget(
  page: PDFPage,
  font: PDFFont,
  item: LaidOutTarget,
  pageHeightPt: number,
): void {
  const geo = shapeGeometryPt(item, pageHeightPt);

  switch (item.target.shape) {
    case "circle":
      page.drawEllipse({
        x: geo.cxPt,
        y: geo.cyPt,
        xScale: geo.widthPt / 2,
        yScale: geo.heightPt / 2,
        borderColor: STROKE_COLOR,
        borderWidth: STROKE_WIDTH_PT,
      });
      break;
    case "square":
    case "rectangle":
      page.drawRectangle({
        x: geo.xPt,
        y: geo.bottomYPt,
        width: geo.widthPt,
        height: geo.heightPt,
        borderColor: STROKE_COLOR,
        borderWidth: STROKE_WIDTH_PT,
      });
      break;
    case "diamond":
      drawDiamond(page, geo);
      break;
  }

  // Center reference dot, useful for called shots.
  page.drawCircle({
    x: geo.cxPt,
    y: geo.cyPt,
    size: CENTER_DOT_RADIUS_IN * PT_PER_IN,
    color: STROKE_COLOR,
  });

  const label = formatLabel(item.target);
  const labelWidthPt = font.widthOfTextAtSize(label, SHAPE_FONT_SIZE_PT);
  page.drawText(label, {
    x: geo.cxPt - labelWidthPt / 2,
    y: geo.bottomYPt - SHAPE_FONT_SIZE_PT - 3,
    size: SHAPE_FONT_SIZE_PT,
    font,
    color: TEXT_COLOR,
  });
}

/** Draws a stage/group header left-aligned within its reserved strip above the stage's targets. */
export function drawStageHeader(
  page: PDFPage,
  boldFont: PDFFont,
  header: GroupHeader,
  pageHeightPt: number,
): void {
  const bottomYPt = flipTopDownYToPdfPt(
    header.yIn,
    STAGE_HEADER_RESERVE_IN,
    pageHeightPt,
  );
  const topYPt = bottomYPt + STAGE_HEADER_RESERVE_IN * PT_PER_IN;
  page.drawText(header.label, {
    x: header.xIn * PT_PER_IN,
    y: topYPt - STAGE_HEADER_FONT_SIZE_PT,
    size: STAGE_HEADER_FONT_SIZE_PT,
    font: boldFont,
    color: STAGE_HEADER_COLOR,
  });
}
