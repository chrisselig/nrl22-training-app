"use client";

import { useMemo } from "react";
import { useSession } from "./SessionProvider";
import { layoutSession, type LaidOutTarget } from "@/lib/target-layout";
import { formatLabel } from "@/lib/target-math";

// Screen-preview scale only — not physically accurate. The PDF export
// (lib/pdf/generate-target-pdf.ts) is the source of truth for exact
// print dimensions; this just needs to look right and share the same
// layoutSession() pipeline so it never contradicts the PDF.
const PX_PER_IN = 46;

function TargetSvg({ item }: { item: LaidOutTarget }) {
  const { target, placement, shapeWidthIn, shapeHeightIn } = item;
  const xPx = placement.xIn * PX_PER_IN;
  const yPx = placement.yIn * PX_PER_IN;
  const wPx = shapeWidthIn * PX_PER_IN;
  const hPx = shapeHeightIn * PX_PER_IN;
  const cx = xPx + wPx / 2;
  const cy = yPx + hPx / 2;

  return (
    <g>
      {target.shape === "circle" && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={wPx / 2}
          ry={hPx / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      )}
      {(target.shape === "square" || target.shape === "rectangle") && (
        <rect
          x={xPx}
          y={yPx}
          width={wPx}
          height={hPx}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      )}
      {target.shape === "diamond" && (
        <polygon
          points={`${cx},${yPx} ${xPx + wPx},${cy} ${cx},${yPx + hPx} ${xPx},${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      )}
      <circle cx={cx} cy={cy} r={2} fill="currentColor" />
      <text
        x={cx}
        y={yPx + hPx + 11}
        textAnchor="middle"
        fontSize={9}
        fill="currentColor"
      >
        {formatLabel(target)}
      </text>
    </g>
  );
}

export function PreviewCanvas() {
  const { session } = useSession();

  const layout = useMemo(() => {
    if (session.targets.length === 0) return { data: null, error: null };
    try {
      return { data: layoutSession(session), error: null };
    } catch (e) {
      return {
        data: null,
        error: e instanceof Error ? e.message : "Could not lay out session.",
      };
    }
  }, [session]);

  if (session.targets.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Add targets to see a print preview.
      </div>
    );
  }

  if (layout.error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {layout.error}
      </div>
    );
  }

  const { pageWidthIn, pageHeightIn, headerReserveIn, items, pageCount } =
    layout.data!;
  const pageWidthPx = pageWidthIn * PX_PER_IN;
  const pageHeightPx = pageHeightIn * PX_PER_IN;

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Preview only, not to scale on screen. Export the PDF and print at{" "}
        <strong>Actual Size / 100%</strong> for correct physical dimensions.
      </p>
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div
          key={pageIndex}
          className="overflow-auto rounded-lg border border-neutral-300 bg-white text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          <svg
            viewBox={`0 0 ${pageWidthPx} ${pageHeightPx}`}
            width={pageWidthPx}
            height={pageHeightPx}
            className="block max-w-full"
            role="img"
            aria-label={`Page ${pageIndex + 1} of ${pageCount}`}
          >
            {session.globalPracticeDistance && (
              <text
                x={pageWidthPx / 2}
                y={(headerReserveIn * PX_PER_IN) / 2 + 4}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="currentColor"
              >
                Practice Distance: {session.globalPracticeDistance.value}{" "}
                {session.globalPracticeDistance.unit}
              </text>
            )}
            {items
              .filter((item) => item.placement.page === pageIndex)
              .map((item) => (
                <TargetSvg key={item.target.id} item={item} />
              ))}
          </svg>
        </div>
      ))}
    </div>
  );
}
