const cardClass =
  "space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900";
const tableWrapClass =
  "overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800";
const tableClass = "w-full text-left text-xs";
const theadClass = "bg-neutral-100 dark:bg-neutral-800";
const rowClass = "border-t border-neutral-200 dark:border-neutral-800";
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
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Reading Wind Without a Meter</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Mirage, environment, and bracketing — three reads that get you to a
          hold before the timer starts. Adapted from the shooting-fundamentals
          field card.
        </p>
      </div>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">1. The Mirage Visual Scale</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Look through your scope and focus slightly short of the target to see
          the heat waves in the air.
        </p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className="p-2">Speed</th>
                <th className="p-2">Angle</th>
                <th className="p-2">What you see</th>
              </tr>
            </thead>
            <tbody>
              <tr className={rowClass}>
                <td className="p-2">0 mph</td>
                <td className="p-2">90° (boil)</td>
                <td className="p-2">
                  Waves rise straight up like steam — no horizontal component.
                </td>
              </tr>
              <tr className={rowClass}>
                <td className="p-2">1–3 mph</td>
                <td className="p-2">~60° tilt</td>
                <td className="p-2">Waves tilt diagonally.</td>
              </tr>
              <tr className={rowClass}>
                <td className="p-2">4–7 mph</td>
                <td className="p-2">~30° tilt</td>
                <td className="p-2">
                  Waves tilt hard, running across the target frame.
                </td>
              </tr>
              <tr className={rowClass}>
                <td className="p-2">8+ mph</td>
                <td className="p-2">flat</td>
                <td className="p-2">Mirage floats completely horizontal.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={cautionClass}>
          <b>Flat is the ceiling.</b> Once mirage goes flat it can&apos;t tell
          you 8 mph from 15 mph — switch to grass or flags at this point.
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          <b>Glass setup:</b> stay at 12–18x magnification for the clearest
          mirage at 100–200 yards while keeping enough field of view to
          transition targets. De-focus your side-focus knob slightly short of
          the target (e.g. dial to 75–80 yd for a 100 yd target) — the target
          softens but the air currents in front of it pop.
        </p>
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">
          2. The Environment as a Speed Gauge
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          No wind flags on the range? Use these baselines.
        </p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className="p-2">Speed</th>
                <th className="p-2">Signs</th>
              </tr>
            </thead>
            <tbody>
              <tr className={rowClass}>
                <td className="p-2">2–3 mph</td>
                <td className="p-2">
                  Faintly felt on your face; leaves twitch slightly.
                </td>
              </tr>
              <tr className={rowClass}>
                <td className="p-2">4–6 mph</td>
                <td className="p-2">
                  Small twigs and light grass move continuously; flags at
                  roughly 45°.
                </td>
              </tr>
              <tr className={rowClass}>
                <td className="p-2">8–12 mph</td>
                <td className="p-2">
                  Branches shake, loose dust/paper lift, flags blow straight
                  out.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">
          3. Build a Wind Bracket Before Your Stage
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Never guess the exact mph while the timer is ticking — establish a
          bracket while waiting in the squad line.
        </p>
        <ol className="list-decimal space-y-1 pl-4 text-xs text-neutral-600 dark:text-neutral-400">
          <li>Observe the flags for 2 minutes before your turn.</li>
          <li>
            Identify the <b>lull</b> (lowest it drops, e.g. 4 mph) and the{" "}
            <b>gust</b> (highest it kicks up, e.g. 10 mph).
          </li>
          <li>Find your holds for those two exact speeds ahead of time.</li>
          <li>Write both holds down before you build your position.</li>
        </ol>
        <div className={tipClass}>
          <b>On the clock, it&apos;s one decision.</b> Lull hold or gust hold —
          not a fresh wind call for every shot.
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">4. The Wind Clock</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          A clock face laid over the range, 12 pointing downrange, sets how much
          of the wind actually pushes your bullet sideways.
        </p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className="p-2">Clock position</th>
                <th className="p-2">Value</th>
                <th className="p-2">Multiplier</th>
              </tr>
            </thead>
            <tbody>
              <tr className={rowClass}>
                <td className="p-2">12 or 6 (head/tail)</td>
                <td className="p-2">No value</td>
                <td className="p-2">×0</td>
              </tr>
              <tr className={rowClass}>
                <td className="p-2">1, 5, 7, 11</td>
                <td className="p-2">Half value</td>
                <td className="p-2">×0.5</td>
              </tr>
              <tr className={rowClass}>
                <td className="p-2">3 or 9</td>
                <td className="p-2">Full value</td>
                <td className="p-2">×1.0</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={cautionClass}>
          <b>A widely-shared version gets this backwards</b> — some sources
          (including AI-generated answers) label 2/4/8/10 o&apos;clock as half
          value and 1/5/7/11 as quarter value. That&apos;s swapped from what
          long-range wind-doping instruction actually teaches. Use the table
          above.
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">
          5. A Representative Hold Table
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Full-value (3/9 o&apos;clock), 10 mph wind, computed from a typical
          subsonic .22LR match load (40gr, MV ~1050 fps, BC .130 G1) — the
          closest thing to a &ldquo;generic NRL22 round.&rdquo; Multiply by your
          wind clock value; scale roughly linearly for other speeds (5 mph ≈
          half this hold, 15 mph ≈ one-and-a-half times it).
        </p>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className="p-2">Range</th>
                <th className="p-2">Full-value 10 mph hold</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["50 yd", "0.7 MIL"],
                ["75 yd", "0.9 MIL"],
                ["100 yd", "1.2 MIL"],
                ["150 yd", "1.7 MIL"],
                ["200 yd", "2.2 MIL"],
                ["50 m", "0.7 MIL"],
                ["100 m", "1.3 MIL"],
                ["200 m", "2.4 MIL"],
                ["300 m", "3.5 MIL"],
                ["400 m", "4.5 MIL"],
              ].map(([range, hold]) => (
                <tr key={range} className={rowClass}>
                  <td className="p-2">{range}</td>
                  <td className="p-2">{hold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={cautionClass}>
          <b>A starting point, not your data.</b> Change the bullet, muzzle
          velocity, or altitude and every number here moves. Treat this as
          roughly what to expect walking onto a stage without a meter, then
          build your real numbers with your own chronograph/ballistic app and
          confirm by truing against actual impacts.
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Two corrections worth naming: wind drift does <b>not</b> scale with
          distance squared — 100 to 200 yards roughly doubles the hold, not
          quadruples it. And there&apos;s no verified rimfire-specific
          &ldquo;wind formula shortcut&rdquo; — the range-times-speed shortcuts
          used for centerfire don&apos;t have a verified constant for slow,
          rapidly-decelerating rimfire bullets.
        </p>
      </section>
    </div>
  );
}
