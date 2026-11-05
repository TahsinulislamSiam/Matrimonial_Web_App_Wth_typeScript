import type { Person } from "@/lib/model";
import { MIN_COMPLETENESS } from "@/lib/constants";

export type MatchReason = {
  key: "intent" | "interests" | "campus" | "city" | "timeline" | "values" | "active" | "verified";
  n?: number;
};

export type ScoreResult = { score: number; reasons: MatchReason[] };

function intentScore(a: string, b: string): number {
  if (a === b) return 25;
  const pair = new Set([a, b]);
  if (pair.has("serious_relationship") && pair.has("marriage_after_graduation")) return 20;
  if (pair.has("friendship_first") && pair.has("serious_relationship")) return 15;
  if (pair.has("friendship_first") && pair.has("marriage_after_graduation")) return 10;
  return 5;
}

function valuesScore(viewer: Person, candidate: Person): number {
  let score = 0;
  if (viewer.religion === candidate.religion && viewer.religion !== "prefer_not_to_say") score += 6;
  if (Math.abs(viewer.importance - candidate.importance) <= 1) score += 4;
  if (
    viewer.relocation === candidate.relocation ||
    viewer.relocation === "open" ||
    candidate.relocation === "open"
  ) {
    score += 3;
  }
  if (
    viewer.studyAbroad === candidate.studyAbroad ||
    viewer.studyAbroad === "unsure" ||
    candidate.studyAbroad === "unsure"
  ) {
    score += 2;
  }
  return Math.min(15, score);
}

export function scorePair(viewer: Person, candidate: Person): ScoreResult {
  const reasons: MatchReason[] = [];
  const shared = viewer.interests.filter((i) => candidate.interests.includes(i));

  const intent = intentScore(viewer.intent, candidate.intent);
  if (intent >= 20) reasons.push({ key: "intent" });

  const interestScore = Math.min(15, shared.length * 4);
  if (shared.length > 0) reasons.push({ key: "interests", n: shared.length });

  let locationScore = 0;
  if (viewer.campusId === candidate.campusId) {
    locationScore = 15;
    reasons.push({ key: "campus" });
  } else if (viewer.universityId === candidate.universityId) {
    locationScore = 12;
    reasons.push({ key: "campus" });
  } else if (viewer.city === candidate.city) {
    locationScore = 8;
    reasons.push({ key: "city" });
  }

  const gradDiff = Math.abs(viewer.gradYear - candidate.gradYear);
  const timelineScore = gradDiff === 0 ? 15 : gradDiff === 1 ? 12 : gradDiff === 2 ? 7 : 2;
  if (gradDiff <= 1) reasons.push({ key: "timeline" });

  const values = valuesScore(viewer, candidate);
  if (values >= 8) reasons.push({ key: "values" });

  const activityScore = candidate.lastActiveDays <= 7 ? 5 : candidate.lastActiveDays <= 30 ? 3 : 1;
  if (candidate.lastActiveDays <= 7) reasons.push({ key: "active" });

  const verificationScore = candidate.verificationLevel >= 2 ? 5 : candidate.verificationLevel >= 1 ? 3 : 0;
  if (candidate.verificationLevel >= 2) reasons.push({ key: "verified" });

  const raw =
    intent + interestScore + locationScore + timelineScore + values + activityScore + verificationScore;
  const score = Math.max(0, Math.min(99, Math.round((raw / 95) * 100)));

  return { score, reasons: reasons.slice(0, 4) };
}

function passesDealbreakers(owner: Person, other: Person): boolean {
  for (const d of owner.dealbreakers) {
    if (d === "smoking" && (other.smoking === "regularly" || other.smoking === "sometimes")) return false;
    if (d === "drinking" && (other.drinking === "regularly" || other.drinking === "sometimes")) return false;
    if (d === "religion" && other.religion !== "prefer_not_to_say" && other.religion !== owner.religion) return false;
    if (d === "study_abroad" && other.studyAbroad === "yes") return false;
    if (d === "relocation" && other.relocation === "must_relocate") return false;
    if (d === "long_distance" && other.city !== owner.city) return false;
  }
  return true;
}

export function genderCompatible(a: Person, b: Person): boolean {
  const wants = (from: Person, to: Person) =>
    from.lookingFor === "everyone" ||
    (from.lookingFor === "women" && to.gender === "woman") ||
    (from.lookingFor === "men" && to.gender === "man");
  return wants(a, b) && wants(b, a);
}

export function ageCompatible(a: Person, b: Person): boolean {
  return b.age >= a.ageMin && b.age <= a.ageMax && a.age >= b.ageMin && a.age <= b.ageMax;
}

export function isEligible(viewer: Person, candidate: Person, excluded: Set<string>): boolean {
  if (candidate.id === viewer.id) return false;
  if (excluded.has(candidate.id)) return false;
  if (candidate.completeness < MIN_COMPLETENESS) return false;
  if (candidate.verificationLevel < 1) return false;
  if (!genderCompatible(viewer, candidate)) return false;
  if (!ageCompatible(viewer, candidate)) return false;
  if (!passesDealbreakers(viewer, candidate)) return false;
  if (!passesDealbreakers(candidate, viewer)) return false;
  return true;
}

export function dhakaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function fnv1a(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type ScoredPerson = { person: Person; score: number; reasons: MatchReason[] };

export function dailyPicks(
  viewer: Person,
  candidates: Person[],
  count: number,
  excluded: Set<string> = new Set(),
  dateKey = dhakaDateKey()
): ScoredPerson[] {
  const eligible = candidates
    .filter((c) => isEligible(viewer, c, excluded))
    .map((person) => {
      const { score, reasons } = scorePair(viewer, person);
      return { person, score, reasons, tie: fnv1a(`${viewer.id}:${dateKey}:${person.id}`) };
    })
    .sort((a, b) => b.score - a.score || a.tie - b.tie);

  const perDepartment = new Map<string, number>();
  const out: typeof eligible = [];
  for (const item of eligible) {
    const used = perDepartment.get(item.person.departmentId) ?? 0;
    if (used >= 2) continue;
    perDepartment.set(item.person.departmentId, used + 1);
    out.push(item);
    if (out.length >= count) break;
  }
  return out;
}
