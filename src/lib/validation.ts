import { z } from "zod";
import { INTENTS, RELIGIONS, GENDERS, LOOKING_FOR, CITIES, REPORT_CATEGORIES } from "@/lib/constants";

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let local: string;
  if (digits.startsWith("+880")) local = digits.slice(4);
  else if (digits.startsWith("880")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;
  if (!/^1[3-9]\d{8}$/.test(local)) return null;
  return `+880${local}`;
}

export function sanitizeText(value: string, max: number): string {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

export const phoneSchema = z
  .string()
  .min(6)
  .transform((v, ctx) => {
    const normalized = normalizePhone(v);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid_phone" });
      return z.NEVER;
    }
    return normalized;
  });

export const signupSchema = z.object({
  phone: phoneSchema,
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date")
    .refine((v) => {
      const d = new Date(v + "T00:00:00Z");
      return !Number.isNaN(d.getTime()) && d < new Date();
    }, "invalid_date"),
  gender: z.enum(GENDERS),
  genderPreference: z.enum(LOOKING_FOR),
  acceptedTerms: z.literal(true),
  ageConfirm: z.literal(true),
});

export const signinSchema = z.object({ phone: phoneSchema });

export const otpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, "invalid_code"),
  purpose: z.enum(["signup", "login"]).default("login"),
});

export const profileSchema = z.object({
  displayName: z.string().min(2).max(40),
  headline: z.string().max(80).optional().default(""),
  bio: z.string().max(500).optional().default(""),
  universityId: z.string().min(1),
  campusId: z.string().min(1),
  departmentId: z.string().optional().default(""),
  yearOfStudy: z.coerce.number().int().min(1).max(6),
  graduationYear: z.coerce.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 7),
  city: z.string().min(1),
  relationshipIntent: z.enum(INTENTS),
  interests: z.array(z.string()).min(1).max(10),
  religion: z.string().optional().default(""),
  religionImportance: z.coerce.number().int().min(1).max(5).optional(),
  religionVisibility: z.enum(["public", "matches", "private"]).default("matches"),
  familyExpectations: z.string().max(300).optional().default(""),
  studyAbroadPlan: z.string().optional().default(""),
  relocationPlan: z.string().optional().default(""),
  motherTongue: z.string().max(40).optional().default("Bangla"),
  smoking: z.string().optional().default(""),
  drinking: z.string().optional().default(""),
  diet: z.string().optional().default(""),
});

export const preferenceSchema = z
  .object({
    ageMin: z.coerce.number().int().min(18).max(40),
    ageMax: z.coerce.number().int().min(18).max(40),
    intents: z.array(z.enum(INTENTS)).default([]),
    religions: z.array(z.string()).default([]),
    universities: z.array(z.string()).default([]),
    cities: z.array(z.string()).default([]),
    gradMin: z.coerce.number().int().optional(),
    gradMax: z.coerce.number().int().optional(),
    dealbreakers: z.array(z.string()).max(3).default([]),
  })
  .refine((v) => v.ageMin <= v.ageMax, { message: "age_range" });

export const messageSchema = z.object({
  body: z.string().min(1).max(1000),
  clientId: z.string().max(64).optional(),
});

export const interestSchema = z.object({
  receiverId: z.string().min(1),
  note: z.string().max(200).optional().default(""),
});

export const reportSchema = z.object({
  subjectUserId: z.string().min(1),
  subjectType: z.enum(["user", "message", "photo"]).default("user"),
  subjectId: z.string().optional(),
  category: z.enum(REPORT_CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  description: z.string().max(500).optional().default(""),
});

export const verificationEmailSchema = z.object({
  universityId: z.string().min(1),
  email: z.string().email().max(254),
});

export const verificationIdSchema = z.object({
  universityId: z.string().min(1),
  note: z.string().max(300).optional().default(""),
});

export const reportCategories = REPORT_CATEGORIES;
export const religionIds = RELIGIONS;
export const cityIds = CITIES.map((c) => c.id);
