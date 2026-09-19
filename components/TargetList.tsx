"use client";

import { useState } from "react";
import { TargetForm } from "./TargetForm";
import { useSession } from "./SessionProvider";
import { computeTargetPrintSize, formatLabel } from "@/lib/target-math";
import type { Target } from "@/lib/types";

const shapeGlyph: Record<Target["shape"], string> = {
  circle: "●",
  square: "■",
  diamond: "◆",
  rectangle: "▭",
};

export function TargetList() {
  const { session, updateTarget, removeTarget, duplicateTarget, moveTarget } = useSession();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (session.targets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        No targets yet. Add one from the course of fire above to build your practice sheet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {session.targets.map((target, index) => {
        if (editingId === target.id) {
          return (
            <li key={target.id}>
              <TargetForm
                initialValue={target}
                onSubmit={(updated) => {
                  updateTarget(target.id, updated);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          );
        }

        let size;
        let sizeError: string | null = null;
        try {
          size = computeTargetPrintSize(target, session.globalPracticeDistance);
        } catch (e) {
          sizeError = e instanceof Error ? e.message : "Invalid target.";
        }

        return (
          <li
            key={target.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden className="text-xl text-neutral-500">
                {shapeGlyph[target.shape]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatLabel(target)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {sizeError
                    ? sizeError
                    : `Prints ${size!.widthIn.toFixed(2)}" x ${size!.heightIn.toFixed(2)}"`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => moveTarget(target.id, "up")}
                className="rounded px-1.5 py-1 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                &#8593;
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === session.targets.length - 1}
                onClick={() => moveTarget(target.id, "down")}
                className="rounded px-1.5 py-1 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                &#8595;
              </button>
              <button
                type="button"
                onClick={() => setEditingId(target.id)}
                className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => duplicateTarget(target.id)}
                className="rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => removeTarget(target.id)}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
