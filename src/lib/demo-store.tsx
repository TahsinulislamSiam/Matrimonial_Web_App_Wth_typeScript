"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  DemoAudit,
  DemoInterest,
  DemoMessage,
  DemoReport,
  DemoState,
  DemoVerification,
  Person,
} from "@/lib/model";
import {
  PEOPLE,
  SEED_AUDIT,
  SEED_INTERESTS,
  SEED_MATCHES,
  SEED_MESSAGES,
  SEED_REPORTS,
  SEED_VERIFICATIONS,
  personById,
} from "@/lib/mock-data";
import { INTENTS } from "@/lib/constants";
import type { Intent } from "@/lib/constants";

const STORAGE_KEY = "cm_demo_v1";

export const initialDemoState: DemoState = {
  version: 1,
  currentUserId: null,
  adminAuthed: false,
  onboardingComplete: false,
  profile: null,
  verificationLevel: 0,
  verificationNote: null,
  interests: SEED_INTERESTS as DemoInterest[],
  matches: SEED_MATCHES,
  messages: SEED_MESSAGES,
  shortlist: [],
  blocks: [],
  reports: SEED_REPORTS as DemoReport[],
  verifications: SEED_VERIFICATIONS as DemoVerification[],
  audit: SEED_AUDIT as DemoAudit[],
  settings: {
    discoverable: true,
    hideUniversity: false,
    showOnline: true,
    notifMatches: true,
    notifMessages: true,
    notifVerification: true,
    notifMarketing: false,
  },
  prefs: {
    ageMin: 21,
    ageMax: 28,
    intents: [],
    religions: [],
    cities: [],
    gradMin: 2026,
    gradMax: 2030,
    dealbreakers: [],
  },
  verificationLevels: {},
  userStatus: {},
};

function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function mergeState(loaded: Partial<DemoState>): DemoState {
  return {
    ...initialDemoState,
    ...loaded,
    settings: { ...initialDemoState.settings, ...(loaded.settings ?? {}) },
    prefs: { ...initialDemoState.prefs, ...(loaded.prefs ?? {}) },
    interests: loaded.interests ?? initialDemoState.interests,
    matches: loaded.matches ?? initialDemoState.matches,
    messages: loaded.messages ?? initialDemoState.messages,
    reports: loaded.reports ?? initialDemoState.reports,
    verifications: loaded.verifications ?? initialDemoState.verifications,
    audit: loaded.audit ?? initialDemoState.audit,
    verificationLevels: loaded.verificationLevels ?? {},
    userStatus: loaded.userStatus ?? {},
  };
}

export type ActionResult = { ok: boolean; error?: string };

type DemoContextValue = {
  state: DemoState;
  hydrated: boolean;
  currentPerson: Person | null;
  people: Person[];
  login: (personId: string) => void;
  logout: () => void;
  completeOnboarding: (data: NonNullable<DemoState["profile"]>) => void;
  updateProfile: (patch: Partial<NonNullable<DemoState["profile"]>>) => void;
  updatePrefs: (patch: Partial<DemoState["prefs"]>) => void;
  updateSettings: (patch: Partial<DemoState["settings"]>) => void;
  sendInterest: (receiverId: string, note?: string) => ActionResult;
  respondInterest: (interestId: string, accept: boolean) => ActionResult;
  toggleShortlist: (personId: string) => void;
  blockUser: (personId: string) => void;
  reportUser: (input: {
    subjectUserId: string;
    category: string;
    description?: string;
    subjectType?: "user" | "message" | "photo";
    subjectId?: string;
    priority?: "p0" | "p1" | "p2";
  }) => void;
  sendMessage: (matchId: string, body: string) => ActionResult;
  unmatch: (matchId: string) => void;
  setVerification: (level: 0 | 1 | 2 | 3, note?: string) => void;
  submitVerification: (method: "email" | "student_id", note?: string) => void;
  adminLogin: (email: string, password: string, code: string) => ActionResult;
  adminLogout: () => void;
  adminVerification: (id: string, decision: "approve" | "reject" | "resubmit", reason: string) => void;
  adminReport: (id: string, action: "dismiss" | "warn" | "suspend" | "ban" | "actioned", notes: string) => void;
  adminUser: (userId: string, action: "suspend" | "ban" | "restore") => void;
  resetDemo: () => void;
  deleteAccount: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(mergeState(JSON.parse(raw) as Partial<DemoState>));
    } catch {
      /* corrupted storage — fall back to seeds */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or disabled */
    }
  }, [state, hydrated]);

  const people = useMemo(
    () =>
      PEOPLE.map((p) => ({
        ...p,
        verificationLevel: state.verificationLevels[p.id] ?? p.verificationLevel,
      })).filter((p) => (state.userStatus[p.id] ?? "active") === "active"),
    [state.verificationLevels, state.userStatus]
  );

  const currentPerson = useMemo<Person | null>(() => {
    if (!state.currentUserId) return null;
    if (state.currentUserId === "me") return personFromProfile(state);
    const base = people.find((p) => p.id === state.currentUserId);
    if (!base) return null;
    return {
      ...base,
      verificationLevel: state.verificationLevels[base.id] ?? state.verificationLevel ?? base.verificationLevel,
      interests: state.profile?.interests?.length ? state.profile.interests : base.interests,
    };
  }, [state, people]);

  const update = useCallback((fn: (prev: DemoState) => DemoState) => setState((prev) => fn(prev)), []);

  const login = useCallback(
    (personId: string) => {
      update((prev) => ({
        ...prev,
        currentUserId: personId,
        onboardingComplete: personId !== "me",
        verificationLevel:
          personId === "me"
            ? prev.verificationLevel
            : (prev.verificationLevels[personId] ?? personById(personId)?.verificationLevel ?? 0),
      }));
    },
    [update]
  );

  const logout = useCallback(() => {
    update((prev) => ({ ...prev, currentUserId: null }));
  }, [update]);

  const completeOnboarding = useCallback(
    (data: NonNullable<DemoState["profile"]>) => {
      update((prev) => ({
        ...prev,
        currentUserId: "me",
        onboardingComplete: true,
        profile: data,
        prefs: {
          ...prev.prefs,
          ageMin: Math.max(18, data.age ? data.age - 3 : prev.prefs.ageMin),
          ageMax: data.age ? data.age + 6 : prev.prefs.ageMax,
        },
      }));
    },
    [update]
  );

  const updateProfile = useCallback(
    (patch: Partial<NonNullable<DemoState["profile"]>>) => {
      update((prev) => (prev.profile ? { ...prev, profile: { ...prev.profile, ...patch } } : prev));
    },
    [update]
  );

  const updatePrefs = useCallback(
    (patch: Partial<DemoState["prefs"]>) => {
      update((prev) => ({ ...prev, prefs: { ...prev.prefs, ...patch } }));
    },
    [update]
  );

  const updateSettings = useCallback(
    (patch: Partial<DemoState["settings"]>) => {
      update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    },
    [update]
  );

  const sendInterest = useCallback(
    (receiverId: string, note = ""): ActionResult => {
      if (!state.currentUserId) return { ok: false, error: "unauthorized" };
      const me = state.currentUserId;
      if (me === receiverId) return { ok: false, error: "invalid" };
      if (state.blocks.includes(receiverId)) return { ok: false, error: "blocked" };
      const existing = state.interests.find(
        (i) => i.senderId === me && i.receiverId === receiverId && ["pending", "accepted"].includes(i.status)
      );
      if (existing) return { ok: false, error: "alreadySent" };
      if (state.matches.some((m) => m.status === "active" && ((m.aId === me && m.bId === receiverId) || (m.aId === receiverId && m.bId === me)))) {
        return { ok: false, error: "alreadyMatched" };
      }
      const today = new Date().toDateString();
      const usedToday = state.interests.filter(
        (i) => i.senderId === me && new Date(i.createdAt).toDateString() === today
      ).length;
      if (usedToday >= 5) return { ok: false, error: "dailyLimit" };

      const interest: DemoInterest = {
        id: uid("i"),
        senderId: me,
        receiverId,
        status: "pending",
        note: note.slice(0, 200),
        createdAt: new Date().toISOString(),
      };
      // Optimistically demonstrate mutual interest: if they already sent one, match immediately.
      const inbound = state.interests.find(
        (i) => i.senderId === receiverId && i.receiverId === me && i.status === "pending"
      );
      if (inbound) {
        const matchId = uid("mt");
        update((prev) => ({
          ...prev,
          interests: prev.interests
            .map((i) => (i.id === inbound.id ? { ...i, status: "accepted" as const, respondedAt: new Date().toISOString() } as DemoInterest : i))
            .concat({ ...interest, status: "accepted" }),
          matches: [...prev.matches, { id: matchId, aId: me, bId: receiverId, status: "active", createdAt: new Date().toISOString() }],
        }));
        return { ok: true };
      }
      update((prev) => ({ ...prev, interests: [...prev.interests, interest] }));
      return { ok: true };
    },
    [state, update]
  );

  const respondInterest = useCallback(
    (interestId: string, accept: boolean): ActionResult => {
      const interest = state.interests.find((i) => i.id === interestId);
      if (!interest || !state.currentUserId) return { ok: false, error: "notFound" };
      if (interest.receiverId !== state.currentUserId) return { ok: false, error: "unauthorized" };
      if (interest.status !== "pending") return { ok: false, error: "invalid" };
      const matchId = uid("mt");
      update((prev) => ({
        ...prev,
        interests: prev.interests.map((i) =>
          i.id === interestId
            ? { ...i, status: accept ? "accepted" : "declined", respondedAt: new Date().toISOString() }
            : i
        ),
        matches: accept
          ? [
              ...prev.matches,
              {
                id: matchId,
                aId: interest.senderId,
                bId: interest.receiverId,
                status: "active",
                createdAt: new Date().toISOString(),
              },
            ]
          : prev.matches,
      }));
      return { ok: true };
    },
    [state, update]
  );

  const toggleShortlist = useCallback(
    (personId: string) => {
      update((prev) => ({
        ...prev,
        shortlist: prev.shortlist.includes(personId)
          ? prev.shortlist.filter((id) => id !== personId)
          : [...prev.shortlist, personId],
      }));
    },
    [update]
  );

  const blockUser = useCallback(
    (personId: string) => {
      update((prev) => ({
        ...prev,
        blocks: prev.blocks.includes(personId) ? prev.blocks : [...prev.blocks, personId],
        matches: prev.matches.map((m) =>
          (m.aId === personId || m.bId === personId) && m.status === "active"
            ? { ...m, status: "unmatched" as const }
            : m
        ),
      }));
    },
    [update]
  );

  const reportUser = useCallback<DemoContextValue["reportUser"]>(
    (input) => {
      if (!state.currentUserId) return;
      const report: DemoReport = {
        id: uid("r"),
        reporterId: state.currentUserId,
        subjectUserId: input.subjectUserId,
        subjectType: input.subjectType ?? "user",
        subjectId: input.subjectId,
        category: input.category,
        description: (input.description ?? "").slice(0, 500),
        priority: input.priority ?? "p2",
        status: "new",
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, reports: [report, ...prev.reports] }));
    },
    [state.currentUserId, update]
  );

  const sendMessage = useCallback(
    (matchId: string, body: string): ActionResult => {
      if (!state.currentUserId) return { ok: false, error: "unauthorized" };
      const trimmed = body.trim();
      if (!trimmed || trimmed.length > 1000) return { ok: false, error: "invalid" };
      const message: DemoMessage = {
        id: uid("msg"),
        matchId,
        senderId: state.currentUserId,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, messages: [...prev.messages, message] }));
      return { ok: true };
    },
    [state.currentUserId, update]
  );

  const unmatch = useCallback(
    (matchId: string) => {
      update((prev) => ({
        ...prev,
        matches: prev.matches.map((m) => (m.id === matchId ? { ...m, status: "unmatched" as const } : m)),
      }));
    },
    [update]
  );

  const setVerification = useCallback(
    (level: 0 | 1 | 2 | 3, note?: string) => {
      update((prev) => ({
        ...prev,
        verificationLevel: level,
        verificationNote: note ?? null,
        verificationLevels:
          prev.currentUserId && prev.currentUserId !== "me"
            ? { ...prev.verificationLevels, [prev.currentUserId]: level }
            : prev.verificationLevels,
      }));
    },
    [update]
  );

  const submitVerification = useCallback(
    (method: "email" | "student_id", note?: string) => {
      if (!state.currentUserId) return;
      const me = state.currentUserId;
      const verification: DemoVerification = {
        id: uid("v"),
        userId: me,
        method,
        status: method === "email" ? "approved" : "pending_review",
        submittedAt: new Date().toISOString(),
        note,
      };
      update((prev) => ({
        ...prev,
        verifications: [verification, ...prev.verifications],
        verificationLevel: method === "email" ? Math.max(prev.verificationLevel, 1) as 1 | 2 | 3 : prev.verificationLevel,
        verificationLevels:
          method === "email"
            ? { ...prev.verificationLevels, [me]: Math.max(prev.verificationLevels[me] ?? 0, 1) as 1 | 2 | 3 }
            : prev.verificationLevels,
      }));
    },
    [state.currentUserId, update]
  );

  const adminLogin = useCallback(
    (email: string, password: string, code: string): ActionResult => {
      if (email.trim().toLowerCase() !== "admin@campusmatch.bd") return { ok: false, error: "invalid" };
      if (password !== "Admin#2026") return { ok: false, error: "invalid" };
      if (!/^\d{6}$/.test(code)) return { ok: false, error: "invalid" };
      update((prev) => ({ ...prev, adminAuthed: true }));
      return { ok: true };
    },
    [update]
  );

  const adminLogout = useCallback(() => {
    update((prev) => ({ ...prev, adminAuthed: false }));
  }, [update]);

  const adminVerification = useCallback(
    (id: string, decision: "approve" | "reject" | "resubmit", reason: string) => {
      const verification = state.verifications.find((v) => v.id === id);
      if (!verification) return;
      const status =
        decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "pending_review";
      update((prev) => ({
        ...prev,
        verifications: prev.verifications.map((v) =>
          v.id === id ? { ...v, status, reason: reason || undefined } : v
        ),
        verificationLevels:
          decision === "approve"
            ? {
                ...prev.verificationLevels,
                [verification.userId]: verification.method === "email" ? 1 : 2,
              }
            : prev.verificationLevels,
        audit: [
          {
            id: uid("a"),
            actor: "Nadia (admin)",
            action: `verification.${decision}`,
            target: verification.userId,
            time: new Date().toISOString(),
          },
          ...prev.audit,
        ],
      }));
    },
    [state.verifications, update]
  );

  const adminReport = useCallback(
    (id: string, action: "dismiss" | "warn" | "suspend" | "ban" | "actioned", notes: string) => {
      const report = state.reports.find((r) => r.id === id);
      if (!report) return;
      update((prev) => ({
        ...prev,
        reports: prev.reports.map((r) =>
          r.id === id
            ? {
                ...r,
                status: action === "dismiss" ? "dismissed" : "actioned",
                resolution: notes || action,
              }
            : r
        ),
        userStatus:
          action === "ban"
            ? { ...prev.userStatus, [report.subjectUserId]: "banned" }
            : action === "suspend"
              ? { ...prev.userStatus, [report.subjectUserId]: "suspended" }
              : prev.userStatus,
        audit: [
          {
            id: uid("a"),
            actor: "Nadia (admin)",
            action: `report.${action}`,
            target: report.subjectUserId,
            time: new Date().toISOString(),
          },
          ...prev.audit,
        ],
      }));
    },
    [state.reports, update]
  );

  const adminUser = useCallback(
    (userId: string, action: "suspend" | "ban" | "restore") => {
      update((prev) => ({
        ...prev,
        userStatus: {
          ...prev.userStatus,
          [userId]: action === "restore" ? "active" : action === "ban" ? "banned" : "suspended",
        },
        audit: [
          {
            id: uid("a"),
            actor: "Nadia (admin)",
            action: `user.${action}`,
            target: userId,
            time: new Date().toISOString(),
          },
          ...prev.audit,
        ],
      }));
    },
    [update]
  );

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialDemoState);
  }, []);

  const deleteAccount = useCallback(() => {
    update((prev) => ({
      ...prev,
      currentUserId: null,
      onboardingComplete: false,
      profile: null,
      verificationLevel: 0,
      shortlist: [],
      blocks: [],
    }));
  }, [update]);

  const value: DemoContextValue = {
    state,
    hydrated,
    currentPerson,
    people,
    login,
    logout,
    completeOnboarding,
    updateProfile,
    updatePrefs,
    updateSettings,
    sendInterest,
    respondInterest,
    toggleShortlist,
    blockUser,
    reportUser,
    sendMessage,
    unmatch,
    setVerification,
    submitVerification,
    adminLogin,
    adminLogout,
    adminVerification,
    adminReport,
    adminUser,
    resetDemo,
    deleteAccount,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

export function useCurrentPerson() {
  return useDemo().currentPerson;
}

function personFromProfile(state: DemoState): Person | null {
  const p = state.profile;
  if (!p) return null;
  const age = p.dob ? Math.max(18, Math.floor((Date.now() - new Date(p.dob).getTime()) / 31557600000)) : 21;
  return {
    id: "me",
    name: p.name || "You",
    gender: p.gender,
    age,
    universityId: p.universityId,
    campusId: p.campusId,
    departmentId: p.departmentId,
    year: p.year,
    gradYear: p.gradYear,
    city: p.city,
    intent: p.intent,
    religion: p.religion,
    importance: p.importance,
    headline: p.headline,
    bio: p.bio,
    interests: p.interests,
    family: p.family,
    studyAbroad: p.studyAbroad,
    relocation: p.relocation,
    smoking: p.smoking,
    drinking: p.drinking,
    diet: p.diet,
    photoSeed: "me",
    photoCount: 3,
    verificationLevel: state.verificationLevel,
    lastActiveDays: 0,
    completeness: completenessFromProfile(p),
    lookingFor: p.lookingFor,
    ageMin: state.prefs.ageMin,
    ageMax: state.prefs.ageMax,
    dealbreakers: state.prefs.dealbreakers,
  };
}

export function completenessFromProfile(p: NonNullable<DemoState["profile"]>): number {
  let score = 0;
  if (p.name) score += 12;
  if (p.headline) score += 6;
  if (p.bio.length > 40) score += 10;
  if (p.universityId && p.campusId && p.departmentId) score += 18;
  if (p.year && p.gradYear) score += 8;
  if (p.city) score += 4;
  if (p.intent) score += 10;
  if (p.interests.length >= 3) score += 10;
  else if (p.interests.length > 0) score += 5;
  if (p.religion) score += 4;
  if (p.family) score += 5;
  if (p.studyAbroad) score += 4;
  if (p.relocation) score += 4;
  if (p.smoking || p.drinking) score += 3;
  return Math.min(100, score);
}

export function matchBetween(state: DemoState, a: string, b: string) {
  return state.matches.find(
    (m) => m.status === "active" && ((m.aId === a && m.bId === b) || (m.aId === b && m.bId === a))
  );
}

export function messagesFor(state: DemoState, matchId: string) {
  return state.messages
    .filter((m) => m.matchId === matchId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function partnerOf(state: DemoState, matchId: string, meId: string): Person | undefined {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return undefined;
  const otherId = match.aId === meId ? match.bId : match.aId;
  return PEOPLE.find((p) => p.id === otherId);
}

export function intentOptions(): Intent[] {
  return [...INTENTS];
}
