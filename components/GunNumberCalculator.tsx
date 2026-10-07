"use client";

import { useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";
const resultClass = "font-mono text-blue-600 dark:text-blue-400";

const YD_PER_M = 1 / 0.9144;
const DISTANCES = Array.from({ length: 40 }, (_, i) => (i + 1) * 10); // 10..400

function holdFor(
  distance: number,
  unit: "yd" | "m",
  adjustedGun: number,
  wind: number,
  value: number,
) {
  const distanceYd = unit === "m" ? distance * YD_PER_M : distance;
  return ((distanceYd / 100) * wind * value) / adjustedGun;
}

export function GunNumberCalculator() {
  const [gunNumber, setGunNumber] = useState("10");
  const [referenceFps, setReferenceFps] = useState("");
  const [actualFps, setActualFps] = useState("");
  const [wind, setWind] = useState("");
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState<"yd" | "m">("yd");
  const [customDistance, setCustomDistance] = useState("");

  const gun = Number(gunNumber);
  const ref = Number(referenceFps);
  const act = Number(actualFps);
  const windMph = Number(wind);
  const clockValue = Number(value);
  const custom = Number(customDistance);

  // fps fields are optional — no chrono reading yet still gets a hold,
  // just without the fps-scaling adjustment applied.
  const adjustedGun = gun ? (ref && act ? gun * (act / ref) : gun) : null;

  const tableReady =
    adjustedGun !== null &&
    Number.isFinite(windMph) &&
    Number.isFinite(clockValue);

  return (
    <div className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="gunNumber">
            Your gun number
          </label>
          <input
            id="gunNumber"
            className={inputClass}
            type="number"
            step="0.1"
            value={gunNumber}
            onChange={(e) => setGunNumber(e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            10 = generic starting constant. True your own for better accuracy —{" "}
            <Link href="/wind/notes" className="underline">
              how to true
            </Link>
            .
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="referenceFps">
            Reference fps <span className="font-normal">(trued at)</span>
          </label>
          <input
            id="referenceFps"
            className={inputClass}
            type="number"
            step="1"
            placeholder="e.g. 1050"
            value={referenceFps}
            onChange={(e) => setReferenceFps(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="actualFps">
            Actual fps <span className="font-normal">(chrono today)</span>
          </label>
          <input
            id="actualFps"
            className={inputClass}
            type="number"
            step="1"
            placeholder="e.g. 1010"
            value={actualFps}
            onChange={(e) => setActualFps(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="windMph">
            Wind <span className="font-normal">(mph)</span>
          </label>
          <input
            id="windMph"
            className={inputClass}
            type="number"
            step="1"
            placeholder="e.g. 10"
            value={wind}
            onChange={(e) => setWind(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="clockValue">
            Clock value
          </label>
          <select
            id="clockValue"
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="1">3/9 o&apos;clock — full (×1.0)</option>
            <option value="0.75">1:30/4:30/7:30/10:30 — ¾ (×0.75)</option>
            <option value="0.5">1/5/7/11 o&apos;clock — half (×0.5)</option>
            <option value="0">12/6 o&apos;clock — none (×0)</option>
          </select>
        </div>
      </div>

      <p className="text-sm font-semibold">
        Adjusted gun number:{" "}
        <span className={resultClass}>
          {adjustedGun ? adjustedGun.toFixed(1) : "—"}
        </span>
      </p>

      <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Hold table
          </span>
          <div className="flex gap-1" role="group" aria-label="Distance unit">
            {(["yd", "m"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  unit === u
                    ? "bg-blue-600 text-white"
                    : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
                }`}
              >
                {u === "yd" ? "Yards" : "Meters"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="customDistance">
            Custom distance <span className="font-normal">({unit})</span>
          </label>
          <input
            id="customDistance"
            className={`${inputClass} max-w-[160px]`}
            type="number"
            step="1"
            placeholder="e.g. 212"
            value={customDistance}
            onChange={(e) => setCustomDistance(e.target.value)}
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800">
              <tr>
                <th className="p-2">Range</th>
                <th className="p-2">Hold</th>
              </tr>
            </thead>
            <tbody>
              {tableReady && custom > 0 && (
                <tr className="border-t border-neutral-200 bg-neutral-100 font-semibold dark:border-neutral-800 dark:bg-neutral-800/60">
                  <td className="p-2">
                    {custom} {unit} (custom)
                  </td>
                  <td className="p-2">
                    {holdFor(
                      custom,
                      unit,
                      adjustedGun!,
                      windMph,
                      clockValue,
                    ).toFixed(2)}{" "}
                    MIL
                  </td>
                </tr>
              )}
              {tableReady &&
                DISTANCES.map((d) => (
                  <tr
                    key={d}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="p-2">
                      {d} {unit}
                    </td>
                    <td className="p-2">
                      {holdFor(
                        d,
                        unit,
                        adjustedGun!,
                        windMph,
                        clockValue,
                      ).toFixed(2)}{" "}
                      MIL
                    </td>
                  </tr>
                ))}
              {!tableReady && (
                <tr>
                  <td
                    className="p-2 text-neutral-500 dark:text-neutral-400"
                    colSpan={2}
                  >
                    Fill in gun number, fps, wind, and clock value above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {unit === "m" && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Meters are converted into yards before the formula runs — this gun
            number was trued in yards. True a separate metric reference if you
            shoot metric matches primarily.
          </p>
        )}
      </div>
    </div>
  );
}
