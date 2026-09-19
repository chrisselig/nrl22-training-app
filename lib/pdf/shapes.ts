import { rgb, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";
import {
  CENTER_DOT_RADIUS_IN,
  PT_PER_IN,
  SHAPE_FONT_SIZE_PT,
} from "./constants";
import { formatLabel } from "../target-math";
import type { LaidOutTarget } from "../target-layout";

const STROKE_COLOR = rgb(0.1, 0.1, 0.1);
const STROKE_WIDTH_PT = 1.5;
const TEXT_COLOR = rgb(0.15, 0.15, 0.15);

interface ShapeGeometry {
  xPt: number;
  bottomYPt: number;
  widthPt: number;
  heightPt: number;
  cxPt: number;
  cyPt: number;
}

/**
 * placement.yIn is top-down inches from the page's top edge (matching
 * lib/packing.ts and the on-screen preview); PDF space is bottom-up. This
 * is the one place that flip happens — every other geometry calculation
 * downstream works in plain PDF (bottom-up) points.
 */
function shapeGeometryPt(
  item: LaidOutTarget,
  pageHeightPt: number,
): ShapeGeometry {
  const widthPt = item.shapeWidthIn * PT_PER_IN;
  const heightPt = item.shapeHeightIn * PT_PER_IN;
  const xPt = item.placement.xIn * PT_PER_IN;
  const topYPt = item.placement.yIn * PT_PER_IN;
  const bottomYPt = pageHeightPt - topYPt - heightPt;
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
