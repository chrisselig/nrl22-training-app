import { PageHeader } from "@/components/PageHeader";
import { GunNumberCalculator } from "@/components/GunNumberCalculator";

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
      <PageHeader eyebrow="Field skills" title="Reading Wind Without a Meter">
        Mirage, environment, and bracketing — three reads that get you to a hold
        before the timer starts. Adapted from the shooting-fundamentals field
        card.
      </PageHeader>

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
        <div className="flex justify-center">
          <svg
            viewBox="0 0 300 325"
            width="240"
            height="260"
            role="img"
            aria-labelledby="windClockTitle"
          >
            <title id="windClockTitle">
              Wind clock dial showing no, half, and full value positions
            </title>
            <circle
              cx="150"
              cy="150"
              r="115"
              fill="#fafbfb"
              stroke="#15171a"
              strokeWidth="2"
            />
            <g stroke="#c9ced3" strokeWidth="1.5">
              <line x1="150" y1="35" x2="150" y2="47" />
              <line x1="207.5" y1="50.4" x2="197.5" y2="58" />
              <line x1="249.6" y1="92.5" x2="239.4" y2="98" />
              <line x1="265" y1="150" x2="253" y2="150" />
              <line x1="249.6" y1="207.5" x2="239.4" y2="202" />
              <line x1="207.5" y1="249.6" x2="197.5" y2="242" />
              <line x1="150" y1="265" x2="150" y2="253" />
              <line x1="92.5" y1="249.6" x2="102.5" y2="242" />
              <line x1="50.4" y1="207.5" x2="60.6" y2="202" />
              <line x1="35" y1="150" x2="47" y2="150" />
              <line x1="50.4" y1="92.5" x2="60.6" y2="98" />
              <line x1="92.5" y1="50.4" x2="102.5" y2="58" />
            </g>
            <g
              fontFamily="ui-monospace,monospace"
              fontSize="11"
              fill="#5c6268"
              textAnchor="middle"
            >
              <text x="150" y="23">
                12
              </text>
              <text x="220" y="40">
                1
              </text>
              <text x="266" y="88">
                2
              </text>
              <text x="281" y="155">
                3
              </text>
              <text x="266" y="221">
                4
              </text>
              <text x="220" y="268">
                5
              </text>
              <text x="150" y="285">
                6
              </text>
              <text x="80" y="268">
                7
              </text>
              <text x="34" y="221">
                8
              </text>
              <text x="19" y="155">
                9
              </text>
              <text x="34" y="88">
                10
              </text>
              <text x="80" y="40">
                11
              </text>
            </g>
            <g stroke="#9fb4c0" strokeWidth="1.4" strokeDasharray="3 3">
              <line x1="150" y1="150" x2="195" y2="105" />
              <line x1="150" y1="150" x2="195" y2="195" />
              <line x1="150" y1="150" x2="105" y2="195" />
              <line x1="150" y1="150" x2="105" y2="105" />
            </g>
            <g
              fontFamily="ui-monospace,monospace"
              fontSize="8"
              fill="#7a94a1"
              textAnchor="middle"
            >
              <text x="202" y="100">
                ¾
              </text>
              <text x="202" y="203">
                ¾
              </text>
              <text x="98" y="203">
                ¾
              </text>
              <text x="98" y="100">
                ¾
              </text>
            </g>
            <g stroke="#5c81a0" strokeWidth="2.4" strokeLinecap="round">
              <line x1="150" y1="150" x2="195" y2="72.1" />
              <line x1="150" y1="150" x2="195" y2="227.9" />
              <line x1="150" y1="150" x2="105" y2="227.9" />
              <line x1="150" y1="150" x2="105" y2="72.1" />
            </g>
            <g
              fontFamily="ui-monospace,monospace"
              fontWeight="700"
              fontSize="11"
              fill="#5c81a0"
              textAnchor="middle"
            >
              <text x="207" y="65">
                ½
              </text>
              <text x="207" y="240">
                ½
              </text>
              <text x="93" y="240">
                ½
              </text>
              <text x="93" y="65">
                ½
              </text>
            </g>
            <g stroke="#2e4a5b" strokeWidth="4" strokeLinecap="round">
              <line x1="150" y1="150" x2="240" y2="150" />
              <line x1="150" y1="150" x2="60" y2="150" />
            </g>
            <g
              fontFamily="ui-monospace,monospace"
              fontWeight="700"
              fontSize="13"
              fill="#2e4a5b"
              textAnchor="middle"
            >
              <text x="247" y="138">
                1.0
              </text>
              <text x="53" y="138">
                1.0
              </text>
            </g>
            <g stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round">
              <line x1="150" y1="150" x2="150" y2="60" />
              <line x1="150" y1="150" x2="150" y2="240" />
            </g>
            <g
              fontFamily="ui-monospace,monospace"
              fontWeight="700"
              fontSize="10"
              fill="#5c6268"
              textAnchor="middle"
            >
              <text x="168" y="92">
                0
              </text>
              <text x="168" y="218">
                0
              </text>
            </g>
            <g transform="translate(150,14)">
              <circle r="9" fill="none" stroke="#15171a" strokeWidth="1.4" />
              <circle r="4.5" fill="none" stroke="#15171a" strokeWidth="1.2" />
              <circle r="1.4" fill="#15171a" />
            </g>
            <text
              x="150"
              y="7"
              textAnchor="middle"
              fontFamily="ui-monospace,monospace"
              fontSize="7"
              letterSpacing=".06em"
              fill="#5c6268"
            >
              TARGET
            </text>
            <circle cx="150" cy="297" r="7" fill="#15171a" />
            <text
              x="150"
              y="312"
              textAnchor="middle"
              fontFamily="ui-monospace,monospace"
              fontSize="7"
              letterSpacing=".06em"
              fill="#5c6268"
            >
              YOU
            </text>
          </svg>
        </div>
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          Where the wind comes <i>from</i>, read on the dial — bold full value
          at 3/9, mid half value at 1/5/7/11, none at 12/6. Dashed ¾ diagonals
          are the optional fourth step.
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

      <section className={cardClass}>
        <h2 className="text-sm font-semibold">6. Your Gun Number</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          A single personal constant for mental-math wind holds, built from one
          of your own trued holds — not a borrowed universal formula.
        </p>
        <div className={cautionClass}>
          <b>Yours, not universal.</b> This constant comes from one load, one
          zero, one elevation — yours. It drifts a couple tenths of a MIL by 200
          yd and isn&apos;t valid for someone else&apos;s rifle or a different
          bullet/velocity. Re-true past 200 yd rather than trusting the
          constant.
        </div>
        <div className="rounded-md border border-neutral-300 p-3 text-center font-mono text-sm dark:border-neutral-700">
          Gun Number = (Range ÷ 100) × Wind(mph) × Value ÷ Hold(MIL)
        </div>
        <div className="rounded-md border border-neutral-300 p-3 text-center font-mono text-sm dark:border-neutral-700">
          Hold(MIL) = (Range ÷ 100) × Wind(mph) × Value ÷ Gun Number
        </div>
        <ol className="list-decimal space-y-1 pl-4 text-xs text-neutral-600 dark:text-neutral-400">
          <li>
            Get one trued, full-value, known-speed wind hold at the distance you
            shoot most (100 yd is typical for NRL22).
          </li>
          <li>
            Plug range, wind speed, value, and that trued hold into the Gun
            Number formula above.
          </li>
          <li>Round to one decimal.</li>
          <li>
            Check it against a second trued distance — if it&apos;s off by more
            than a click or two there, true that distance on its own rather than
            trusting one constant past 150–200 yd.
          </li>
        </ol>
        <div className={cautionClass}>
          <b>Linear scaling, not a new trajectory.</b> .22LR velocity swings
          30–80 fps lot-to-lot, more in the cold. Scale your gun number
          straight-line off a chrono reading before trusting it past a ~100 fps
          shift — it&apos;s an approximation, not a re-run ballistic solve.
        </div>
        <GunNumberCalculator />
      </section>
    </div>
  );
}
