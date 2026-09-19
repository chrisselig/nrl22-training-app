"use client";

import { useState, type FormEvent } from "react";
import { generateId } from "./SessionProvider";
import type {
  AngularUnit,
  Distance,
  DistanceUnit,
  Shape,
  Target,
} from "@/lib/types";

interface TargetFormProps {
  initialValue?: Target;
  onSubmit: (target: Target) => void;
  onCancel?: () => void;
}

const SHAPES: { value: Shape; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "square", label: "Square" },
  { value: "diamond", label: "Diamond" },
  { value: "rectangle", label: "Rectangle" },
];

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";

export function TargetForm({
  initialValue,
  onSubmit,
  onCancel,
}: TargetFormProps) {
  const [shape, setShape] = useState<Shape>(initialValue?.shape ?? "circle");

  const [angularValue, setAngularValue] = useState(
    initialValue && initialValue.shape !== "rectangle"
      ? String(initialValue.angularSize.value)
      : "1",
  );
  const [angularUnit, setAngularUnit] = useState<AngularUnit>(
    initialValue && initialValue.shape !== "rectangle"
      ? initialValue.angularSize.unit
      : "mil",
  );

  const [angularWidth, setAngularWidth] = useState(
    initialValue?.shape === "rectangle"
      ? String(initialValue.angularWidth.value)
      : "2",
  );
  const [angularWidthUnit, setAngularWidthUnit] = useState<AngularUnit>(
    initialValue?.shape === "rectangle"
      ? initialValue.angularWidth.unit
      : "mil",
  );
  const [angularHeight, setAngularHeight] = useState(
    initialValue?.shape === "rectangle"
      ? String(initialValue.angularHeight.value)
      : "1",
  );
  const [angularHeightUnit, setAngularHeightUnit] = useState<AngularUnit>(
    initialValue?.shape === "rectangle"
      ? initialValue.angularHeight.unit
      : "mil",
  );

  const [rangeValue, setRangeValue] = useState(
    String(initialValue?.representedRange.value ?? "38"),
  );
  const [rangeUnit, setRangeUnit] = useState<DistanceUnit>(
    initialValue?.representedRange.unit ?? "yd",
  );

  const [useOverride, setUseOverride] = useState(
    Boolean(initialValue?.overrideDistance),
  );
  const [overrideValue, setOverrideValue] = useState(
    String(initialValue?.overrideDistance?.value ?? "25"),
  );
  const [overrideUnit, setOverrideUnit] = useState<DistanceUnit>(
    initialValue?.overrideDistance?.unit ?? "yd",
  );

  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const range: Distance = { value: Number(rangeValue), unit: rangeUnit };
    if (!Number.isFinite(range.value) || range.value <= 0) {
      setError("Represented range must be a positive number.");
      return;
    }

    let override: Distance | undefined;
    if (useOverride) {
      override = { value: Number(overrideValue), unit: overrideUnit };
      if (!Number.isFinite(override.value) || override.value <= 0) {
        setError("Override print distance must be a positive number.");
        return;
      }
    }

    const id = initialValue?.id ?? generateId();

    if (shape === "rectangle") {
      const angularWidthVal: Distance["value"] = Number(angularWidth);
      const angularHeightVal: Distance["value"] = Number(angularHeight);
      if (!Number.isFinite(angularWidthVal) || angularWidthVal <= 0) {
        setError("Angular width must be a positive number.");
        return;
      }
      if (!Number.isFinite(angularHeightVal) || angularHeightVal <= 0) {
        setError("Angular height must be a positive number.");
        return;
      }
      onSubmit({
        id,
        shape,
        angularWidth: { value: angularWidthVal, unit: angularWidthUnit },
        angularHeight: { value: angularHeightVal, unit: angularHeightUnit },
        representedRange: range,
        overrideDistance: override,
      });
      return;
    }

    const angularSizeVal = Number(angularValue);
    if (!Number.isFinite(angularSizeVal) || angularSizeVal <= 0) {
      setError("Angular size must be a positive number.");
      return;
    }
    onSubmit({
      id,
      shape,
      angularSize: { value: angularSizeVal, unit: angularUnit },
      representedRange: range,
      overrideDistance: override,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <div>
        <label className={labelClass} htmlFor="shape">
          Shape
        </label>
        <select
          id="shape"
          className={inputClass}
          value={shape}
          onChange={(e) => setShape(e.target.value as Shape)}
        >
          {SHAPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {shape === "rectangle" ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor="angularWidth">
              Width
            </label>
            <div className="flex gap-1">
              <input
                id="angularWidth"
                className={inputClass}
                type="number"
                step="any"
                min="0"
                value={angularWidth}
                onChange={(e) => setAngularWidth(e.target.value)}
              />
              <select
                aria-label="Width unit"
                className={inputClass}
                value={angularWidthUnit}
                onChange={(e) =>
                  setAngularWidthUnit(e.target.value as AngularUnit)
                }
              >
                <option value="mil">MIL</option>
                <option value="moa">MOA</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="angularHeight">
              Height
            </label>
            <div className="flex gap-1">
              <input
                id="angularHeight"
                className={inputClass}
                type="number"
                step="any"
                min="0"
                value={angularHeight}
                onChange={(e) => setAngularHeight(e.target.value)}
              />
              <select
                aria-label="Height unit"
                className={inputClass}
                value={angularHeightUnit}
                onChange={(e) =>
                  setAngularHeightUnit(e.target.value as AngularUnit)
                }
              >
                <option value="mil">MIL</option>
                <option value="moa">MOA</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className={labelClass} htmlFor="angularSize">
            Target size
          </label>
          <div className="flex gap-1">
            <input
              id="angularSize"
              className={inputClass}
              type="number"
              step="any"
              min="0"
              value={angularValue}
              onChange={(e) => setAngularValue(e.target.value)}
            />
            <select
              aria-label="Target size unit"
              className={inputClass}
              value={angularUnit}
              onChange={(e) => setAngularUnit(e.target.value as AngularUnit)}
            >
              <option value="mil">MIL</option>
              <option value="moa">MOA</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="rangeValue">
          Official course-of-fire distance
        </label>
        <div className="flex gap-1">
          <input
            id="rangeValue"
            className={inputClass}
            type="number"
            step="any"
            min="0"
            value={rangeValue}
            onChange={(e) => setRangeValue(e.target.value)}
          />
          <select
            aria-label="Distance unit"
            className={inputClass}
            value={rangeUnit}
            onChange={(e) => setRangeUnit(e.target.value as DistanceUnit)}
          >
            <option value="yd">yd</option>
            <option value="m">m</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={useOverride}
            onChange={(e) => setUseOverride(e.target.checked)}
          />
          Override print distance for this target only
        </label>
        {useOverride && (
          <div className="flex gap-1">
            <input
              className={inputClass}
              type="number"
              step="any"
              min="0"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              aria-label="Override distance value"
            />
            <select
              aria-label="Override distance unit"
              className={inputClass}
              value={overrideUnit}
              onChange={(e) => setOverrideUnit(e.target.value as DistanceUnit)}
            >
              <option value="yd">yd</option>
              <option value="m">m</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initialValue ? "Save changes" : "Add target"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
