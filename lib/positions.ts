export const POSITION_IDS = [
  "prone",
  "seated",
  "kneeling-high",
  "kneeling-low",
  "standing-supported",
  "standing-unsupported",
  "reverse-kneeling",
  "squatting",
  "other",
] as const;

export type PositionId = (typeof POSITION_IDS)[number];

export const POSITION_LABELS: Record<PositionId, string> = {
  prone: "Prone",
  seated: "Seated",
  "kneeling-high": "Kneeling (high)",
  "kneeling-low": "Kneeling (low)",
  "standing-supported": "Standing, supported",
  "standing-unsupported": "Standing, unsupported",
  "reverse-kneeling": "Reverse kneeling",
  squatting: "Squatting",
  other: "Other",
};

export function isPositionId(value: unknown): value is PositionId {
  return (
    typeof value === "string" &&
    (POSITION_IDS as readonly string[]).includes(value)
  );
}
