import type { Intent } from "@/lib/constants";

export type Gender = "woman" | "man";
export type LookingFor = "women" | "men" | "everyone";

export type Person = {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  universityId: string;
  campusId: string;
  departmentId: string;
  year: number;
  gradYear: number;
  city: string;
  intent: Intent;
  religion: string;
  importance: number;
  headline: string;
  bio: string;
  interests: string[];
  family: string;
  studyAbroad: string;
  relocation: string;
  smoking: string;
  drinking: string;
  diet: string;
  photoSeed: string;
  photoCount: number;
  verificationLevel: number;
  lastActiveDays: number;
  completeness: number;
  lookingFor: LookingFor;
  ageMin: number;
  ageMax: number;
  dealbreakers: string[];
  isDemo?: boolean;
  phoneLast4?: string;
};

export type InterestStatus = "pending" | "accepted" | "declined" | "expired" | "withdrawn";

export type DemoInterest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: InterestStatus;
  note?: string;
  createdAt: string;
  respondedAt?: string;
};

export type DemoMatch = {
  id: string;
  aId: string;
  bId: string;
  createdAt: string;
  status: "active" | "unmatched";
};

export type DemoMessage = {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type DemoReport = {
  id: string;
  reporterId: string;
  subjectUserId: string;
  subjectType: "user" | "message" | "photo";
  subjectId?: string;
  category: string;
  description: string;
  priority: "p0" | "p1" | "p2";
  status: "new" | "triaged" | "actioned" | "dismissed";
  createdAt: string;
  resolution?: string;
};

export type DemoVerification = {
  id: string;
  userId: string;
  method: "email" | "student_id";
  status: "pending_review" | "approved" | "rejected";
  submittedAt: string;
  note?: string;
  reason?: string;
};

export type DemoAudit = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
};

export type DemoState = {
  version: 1;
  currentUserId: string | null;
  adminAuthed: boolean;
  onboardingComplete: boolean;
  profile: {
    name: string;
    gender: Gender;
    lookingFor: LookingFor;
    dob: string;
    age: number;
    headline: string;
    bio: string;
    universityId: string;
    campusId: string;
    departmentId: string;
    year: number;
    gradYear: number;
    city: string;
    intent: Intent;
    interests: string[];
    religion: string;
    importance: number;
    religionVisibility: "public" | "matches" | "private";
    family: string;
    studyAbroad: string;
    relocation: string;
    smoking: string;
    drinking: string;
    diet: string;
  } | null;
  verificationLevel: 0 | 1 | 2 | 3;
  verificationLevels: Record<string, 1 | 2 | 3>;
  userStatus: Record<string, "active" | "suspended" | "banned">;
  verificationNote: string | null;
  interests: DemoInterest[];
  matches: DemoMatch[];
  messages: DemoMessage[];
  shortlist: string[];
  blocks: string[];
  reports: DemoReport[];
  verifications: DemoVerification[];
  audit: DemoAudit[];
  settings: {
    discoverable: boolean;
    hideUniversity: boolean;
    showOnline: boolean;
    notifMatches: boolean;
    notifMessages: boolean;
    notifVerification: boolean;
    notifMarketing: boolean;
  };
  prefs: {
    ageMin: number;
    ageMax: number;
    intents: Intent[];
    religions: string[];
    cities: string[];
    gradMin: number;
    gradMax: number;
    dealbreakers: string[];
  };
};
