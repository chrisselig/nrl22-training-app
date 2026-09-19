export type DistanceUnit = "yd" | "m";
export type AngularUnit = "mil" | "moa";
export type Shape = "circle" | "square" | "diamond" | "rectangle";
export type PaperSize = "letter" | "a4";

export interface Distance {
  value: number;
  unit: DistanceUnit;
}

export interface Angular {
  value: number;
  unit: AngularUnit;
}

interface TargetBase {
  id: string;
  /** The official course-of-fire distance this target represents. */
  representedRange: Distance;
  /**
   * Per-target print distance override. If unset, falls back to the
   * session's global practice distance, then to representedRange itself.
   */
  overrideDistance?: Distance;
}

export type Target =
  | (TargetBase & {
      shape: "circle" | "square" | "diamond";
      angularSize: Angular;
    })
  | (TargetBase & {
      shape: "rectangle";
      angularWidth: Angular;
      angularHeight: Angular;
    });

export interface Session {
  schemaVersion: 1;
  paperSize: PaperSize;
  /** The distance the shooter will actually stand at when practicing. */
  globalPracticeDistance?: Distance;
  targets: Target[];
}

export function createEmptySession(): Session {
  return {
    schemaVersion: 1,
    paperSize: "letter",
    targets: [],
  };
}
