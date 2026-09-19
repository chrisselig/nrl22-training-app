"use client";

import { useState } from "react";
import { useSession } from "./SessionProvider";
import type { DistanceUnit, PaperSize } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";

export function PageSettings() {
  const { session, setPaperSize, setGlobalPracticeDistance } = useSession();
  const [usePractice, setUsePractice] = useState(
    Boolean(session.globalPracticeDistance),
  );
  const [practiceValue, setPracticeValue] = useState(
    String(session.globalPracticeDistance?.value ?? "50"),
  );
  const [practiceUnit, setPracticeUnit] = useState<DistanceUnit>(
    session.globalPracticeDistance?.unit ?? "m",
  );

  function applyPracticeDistance(
    nextEnabled: boolean,
    value: string,
    unit: DistanceUnit,
  ) {
    if (!nextEnabled) {
      setGlobalPracticeDistance(undefined);
      return;
    }
    const numeric = Number(value);
    setGlobalPracticeDistance(
      numeric > 0 ? { value: numeric, unit } : undefined,
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div>
        <label className={labelClass} htmlFor="paperSize">
          Paper size
        </label>
        <select
          id="paperSize"
          className={inputClass}
          value={session.paperSize}
          onChange={(e) => setPaperSize(e.target.value as PaperSize)}
        >
          <option value="letter">Letter (8.5 x 11 in)</option>
          <option value="a4">A4 (210 x 297 mm)</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={usePractice}
            onChange={(e) => {
              setUsePractice(e.target.checked);
              applyPracticeDistance(
                e.target.checked,
                practiceValue,
                practiceUnit,
              );
            }}
          />
          I&apos;ll be shooting from a fixed practice distance
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Every target scales down to look correct from this distance, and it
          prints at the top of every page. Leave unchecked to print each target
          at true full scale.
        </p>
        {usePractice && (
          <div className="flex gap-1">
            <input
              className={inputClass}
              type="number"
              step="any"
              min="0"
              value={practiceValue}
              onChange={(e) => {
                setPracticeValue(e.target.value);
                applyPracticeDistance(
                  usePractice,
                  e.target.value,
                  practiceUnit,
                );
              }}
              aria-label="Practice distance value"
            />
            <select
              aria-label="Practice distance unit"
              className={inputClass}
              value={practiceUnit}
              onChange={(e) => {
                const unit = e.target.value as DistanceUnit;
                setPracticeUnit(unit);
                applyPracticeDistance(usePractice, practiceValue, unit);
              }}
            >
              <option value="yd">yd</option>
              <option value="m">m</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
