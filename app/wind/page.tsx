import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { GunNumberCalculator } from "@/components/GunNumberCalculator";

const cardClass =
  "space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900";
const cautionClass =
  "rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
const tipClass =
  "rounded-md border border-blue-300 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200";

export const metadata = {
  title: "Wind Reading — NRL22 Target Printer",
};

export default function WindPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 lg:p-6">
      <PageHeader eyebrow="Field skills" title="Wind Hold Calculator">
        Mental-math wind holds from a single personal constant, adjusted for
        today&apos;s chrono reading.
      </PageHeader>

      <section className={cardClass}>
        <div className="rounded-md border border-neutral-300 p-3 text-center font-mono text-sm dark:border-neutral-700">
          Gun Number = (Range ÷ 100) × Wind(mph) × Value ÷ Hold(MIL)
        </div>
        <div className="rounded-md border border-neutral-300 p-3 text-center font-mono text-sm dark:border-neutral-700">
          Hold(MIL) = (Range ÷ 100) × Wind(mph) × Value ÷ Gun Number
        </div>
        <div className={cautionClass}>
          <b>Yours, not universal.</b> This constant comes from one load, one
          zero, one elevation — yours. Re-true past 200 yd rather than trusting
          the constant.
        </div>
        <div className={cautionClass}>
          <b>Linear scaling, not a new trajectory.</b> .22LR velocity swings
          30–80 fps lot-to-lot, more in the cold. Scaling your gun number
          straight-line off a chrono reading is an approximation, not a re-run
          ballistic solve — don&apos;t trust it past a ~100 fps shift.
        </div>
        <GunNumberCalculator />
      </section>

      <div className={tipClass}>
        Mirage, environment baselines, the wind clock, and how to true your own
        Gun Number are on the{" "}
        <Link href="/wind/notes" className="underline">
          Wind Reading Notes
        </Link>{" "}
        page.
      </div>
    </div>
  );
}
