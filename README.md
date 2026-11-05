# CampusMatch BD — architecture & product pack

Verified-student matchmaking PWA for Bangladesh. Trust-first, privacy-first, no minors.

## Documents

| # | File | Contents | Status |
|---|---|---|---|
| 1 | [`docs/01-prd.md`](docs/01-prd.md) | Product requirements: personas, MVP scope, 40+ user stories with acceptance criteria, NFRs, metrics, launch gates, assumptions, open questions | ✅ Draft v0.1 |
| 2 | [`docs/02-architecture.md`](docs/02-architecture.md) | System context, deployment, module boundaries, 4 key sequence flows, tech decisions with rejected alternatives, security/reliability/CI-CD | ✅ Draft v0.1 |
| 3 | [`docs/03-data-model.md`](docs/03-data-model.md) | 30+ tables across 7 schemas, ERDs, DDL, index plan, RLS policies, data classification, retention matrix, migrations | ✅ Draft v0.1 |
| 4 | API design | Endpoints, roles, permission matrix, error model, webhooks | ⏳ Awaiting confirmation |
| 5 | Threat model + security checklist | STRIDE, OWASP ASVS L2 mapping | ⏳ |
| 6 | UX flows | Onboarding, verification, matching, chat, reporting + a11y notes | ⏳ |
| 7 | MVP roadmap | Milestones, timeline, team, cost | ⏳ |
| 8 | Test strategy | Unit, integration, security, a11y, load | ⏳ |
| 9 | Campus launch plan | Cold start, gender balance | ⏳ |
| 10 | Risks, legal, open questions | | ⏳ |

## Key product decisions

- **MVP:** phone OTP + university email/student-ID verification, profile with intent/values, filtered search + 6 daily matches, mutual interest → chat, block/report, admin moderation, PWA in Bangla + English.
- **Not in MVP:** compatibility quiz, video calls, voice notes, payments/premium, incognito, guardian mode, native apps.
- **Verification before visibility:** unverified accounts appear nowhere.
- **Passwordless consumer auth**; Argon2id + mandatory TOTP for staff only.
- **No E2EE in chat for P1** — moderation and legal obligations require server-side access; disclosed to users.

## Reading order for a new engineer

`02-architecture.md` §4 (module boundaries) → `03-data-model.md` §3 (tables) → `01-prd.md` §5 (acceptance criteria) → then item 4 (API) once approved.

## Next step

Review items 1–3 and answer the open questions in `01-prd.md` §10 (at minimum: city + first two universities, launch date, budget, and moderation staffing). Items 4–10 follow on confirmation.
