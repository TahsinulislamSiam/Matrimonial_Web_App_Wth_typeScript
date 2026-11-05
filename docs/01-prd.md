# CampusMatch BD — Product Requirements Document

| | |
|---|---|
| **Version** | 0.1 (draft for review) |
| **Date** | 2026-11-01 |
| **Owner** | Product Lead |
| **Status** | Awaiting sign-off on scope + open questions |
| **Related docs** | `02-architecture.md`, `03-data-model.md` |

> Working name: **CampusMatch BD**. Positioning: *serious relationship / pre-marriage matching for verified students.* Not a dating app, not a matrimonial classifieds site.

---

## 1. Vision and product principles

**Vision.** A Bangladeshi student can open one app, know that every profile behind it belongs to a real, adult, currently-enrolled student, and have one calm, private conversation that could lead to marriage — without being exposed, scraped, or harassed.

**Principles (these decide every trade-off below):**

1. **Verified before visible.** An unverified account can complete onboarding but appears in no search results, receives no matches, and cannot send interests.
2. **Intent over inventory.** 6 curated matches per day, not an infinite feed. No swipe gesture, no "likes you" counter for free users.
3. **Consent at every step.** Chat unlocks only after mutual acceptance. Photos are blurred until both sides accept. Nothing is shared with a third party by default.
4. **Privacy by default, not by settings.** Phone numbers are never exposed. No exact location, no contact list upload, no third-party ad trackers.
5. **Safety is a product surface.** Block and report are reachable in ≤2 taps from any profile or message, with a published response SLA.
6. **Light by design.** First meaningful screen in <3s on a throttled 3G Android device; usable on a 2 GB RAM phone.
7. **No minors. Ever.** Age assurance is a launch gate, not a checkbox.

---

## 2. Positioning

| Alternative | What it does | Our difference |
|---|---|---|
| Facebook marriage groups | Free, high volume, zero verification | Verified enrollment, no public posting, no phone numbers |
| Tinder / Bumble | Casual, swipe-first, photo-first | Intent declared up front; curated; campus-scoped; no endless feed |
| Biye.com / traditional matrimonial sites | Family/biodata driven, pay-to-contact, parent-run | Student-first, self-owned profile, values-first matching, mobile PWA |
| University Facebook "matchmaking" pages | Anonymous confessions, screenshot culture | Accountable identity, screenshot deterrence, moderation with SLAs |

**Wedge:** trust. The first campus launch wins by being the place where women feel safe enough to join — that is the constraint that determines everything else.

---

## 3. Personas

| Persona | Context | Jobs to be done | Fears |
|---|---|---|---|
| **Rima, 21**, DU, 3rd year Sociology | Mid-range Android, 4G, 3–5 GB/month data | Find someone serious about marriage after graduation; keep family and classmates from finding out | Screenshots, being recognised by her department, time-wasters |
| **Tanvir, 23**, BUET, final year | Night owl, unstable Wi-Fi, studies a lot | Meet someone with similar ambition; low-effort daily browsing | Rejection, wasting time, fake profiles |
| **Nusrat, 19**, private university, 1st year | Harassed on Facebook before; wary | Friendship first, control over who sees her photos | Catfishing, blackmail, being contacted by strangers |
| **Farhan, 27**, part-time moderator | Reviews ID + selfie queue, 4h shifts | Clear queue, fast decisions, protection from doxxing | Being blamed for a bad call; no audit trail |
| **Admin (ops lead)** | Owns campus growth + trust metrics | Campus-level analytics, ban control, auditability | Regulatory exposure, staff account takeover |

---

## 4. Scope

### 4.1 Phase 1 — MVP (launch, one city, 2 campuses)

| Area | In MVP |
|---|---|
| Auth | Phone OTP, university email verification, student ID + selfie review, 18+ gate, badges, session list/revoke |
| Profile | University/department/year/graduation/city, intent, values & lifestyle, interests, 3–6 photos with blur-until-match, completeness meter, preferences & dealbreakers |
| Matching | Filtered search (university, city, department, year, intent, graduation year, interests), 6 daily matches with score + "why you match", same-campus mode, shortlist |
| Interaction | Send/accept/decline interest (daily cap), chat unlock on mutual accept, text chat with icebreaker prompts, block/report everywhere, unmatch |
| Safety | Report queue + SLA, image moderation (auto + human), watermark on photos, safe-meeting guidance, data export/delete |
| Admin | Verification review, report queue, user suspension/ban, role-based staff accounts with mandatory 2FA, audit log |
| Platform | Mobile-first PWA, Bangla + English, push + email notifications, installable, offline shell |

**Explicitly not in MVP:** compatibility quiz, video calls, voice notes, payments/premium, incognito mode, guardian mode, native apps, OpenSearch, matchmaker service.

### 4.2 Phase 1.5 (weeks 6–14 after launch)

Incognito + "hide me from my university", saved searches with alerts, voice notes, 12-question compatibility quiz + weighted score, premium entitlements (no payment yet — campus-partner codes), profile prompts, "who viewed me" for premium only.

### 4.3 Phase 2 (months 4–8)

bKash/Nagad/SSLCommerz payments + subscriptions, in-app video calls (vendor WebRTC, no recording), full compatibility engine, native wrappers, second city.

### 4.4 Phase 3

Matchmaker-assisted tier, trusted-contact safety check-in, regional expansion.

### 4.5 Non-goals (do not build)

- Any flow that admits or retains under-18s.
- Public follower graph, public comments, or public profile URLs.
- Exact/real-time location sharing or "distance in metres".
- Face search, reverse-image search of users, or selling/exporting user data.
- Uploading a contact list or importing friends.
- Guardian/parent access to chats or matches.
- Third-party ad/analytics SDKs that fingerprint or track across sites.

---

## 5. Functional requirements

Legend — **P1** MVP · **P1.5** fast-follow · **P2** later.
Every story includes testable acceptance criteria (AC). IDs are stable and referenced by the API, tests, and Jira.

### 5.1 Accounts and verification

#### AUTH-01 · Phone signup with OTP — P1
*As a prospective student I want to sign up with my phone number so that I can start without inventing a password.*

- **AC1** Accepts only BD mobile formats (`+8801[3-9]XXXXXXXX`); normalises to E.164 before storage.
- **AC2** OTP is 6 digits, valid 5 minutes, max 5 verification attempts, resend allowed after 60s, max 3 sends/hour/phone and 10 sends/day/IP. Exceeding limits returns a generic message and a retry-after, never reveals whether the number exists.
- **AC3** OTPs are stored only as an HMAC digest with a server-side pepper; plaintext exists only in the SMS payload.
- **AC4** On success, a user row is created with `phone_verified_at`, a 30-day rotating refresh session, and a 10-minute access token.
- **AC5** Every device gets its own session row with device label, coarse IP hash, and last-used time; the user can revoke any session and "log out everywhere".
- **AC6** SMS provider failure is retried by the queue with backoff; the user sees "couldn't send, try again in Xs" and can switch to a voice-call OTP fallback.

#### AUTH-02 · University email verification — P1
*As a student I want to prove I attend my university with my institutional email.*

- **AC1** The email domain must exactly match an entry in the university's `email_domains` allowlist (e.g. `du.ac.bd`, `buet.ac.bd`, `northsouth.edu`). Suffix matching alone is not sufficient — the allowlist is admin-managed.
- **AC2** A 6-digit code (or signed magic link) is sent to the institutional address; link/code expires in 15 minutes and is single-use.
- **AC3** Success sets `verification_level >= email` and awards the **Verified Student** badge. Email is displayed masked (`r***@du.ac.bd`) and never returned in any public API response.
- **AC4** A domain already used by another active account does not block signup (students legitimately share domains) but raises a soft signal; one email can verify only one account at a time.
- **AC5** If the university is not in the allowlist, the user is routed to the student-ID path (AUTH-03) and told why.

#### AUTH-03 · Student ID + selfie verification — P1
*As a student whose university has no usable email domain, I want to verify with my student ID and a selfie.*

- **AC1** Upload requires: (a) student ID card photo showing name, photo, institution, and a valid/expiry indicator; (b) a live-capture selfie (camera only, no gallery upload) holding the ID or a handwritten code.
- **AC2** Files go to the locked-down KYC bucket via short-lived presigned POST; they are never publicly readable and never served through the CDN.
- **AC3** Automated pre-checks run before human review: face presence and face-match score between selfie and ID, image quality, duplicate-document hash, and a liveness/anti-spoof signal. Low-confidence results are queued for human review, never auto-approved.
- **AC4** A reviewer sees a redacted view (name partially masked, ID number masked) and records one decision: approve, reject with reason code, or request resubmission (max 2 resubmissions).
- **AC5** Decision SLA is 48h; the user is notified at submission, on decision, and at 24h if still pending.
- **AC6** On decision, the documents are deleted from the KYC bucket within 24h (hard deadline 7 days if a fraud investigation is open). Only `verified_at`, method, reviewer ID, decision reason, and a salted evidence hash remain.
- **AC7** Verified status expires at the end of the stated graduation year + 6 months; the user is prompted to re-verify.

#### AUTH-04 · 18+ enforcement — P1
*As the platform I must ensure no minor can create or keep an account.*

- **AC1** Date of birth is mandatory at signup. A DOB implying age < 18 at the time of signup is a hard block, with a neutral message and no account creation. The attempt is logged (hashed identifier, no PII) for abuse monitoring.
- **AC2** DOB is immutable after verification. Changing it requires a support ticket plus re-verification; all changes are audit-logged.
- **AC3** If DOB implies age 18–18.5, the account is limited to browsing only until ID review confirms the date.
- **AC4** Any report or moderation finding that a user is a minor results in immediate suspension (<15 min), content removal, and a documented escalation; the account and its media are purged per the retention policy.
- **AC5** Age is never displayed; only derived age buckets are used in matching and are never exposed to other users.

> **Policy note:** self-declared DOB + student ID is *age assurance*, not proof of identity. This is the pragmatic MVP trade-off; see `03-data-model.md` §7 and open question Q4.

#### AUTH-05 · Badges — P1
- **AC1** Badges are `Verified Student` (email or ID) and `Verified Campus` (ID review confirming the specific campus). They are derived server-side from verification records, never client-set.
- **AC2** Badge tooltips explain exactly what was checked and when (month/year only).
- **AC3** Losing a verification removes the badge within one request cycle and notifies the user.

#### AUTH-06 · Optional 2FA and session management — P1
- **AC1** Users can enable TOTP 2FA; recovery codes are shown once and stored hashed.
- **AC2** New-device login triggers an email/SMS alert with device + approximate city, and a one-tap "this wasn't me" revoke link.
- **AC3** Sensitive actions (change phone, delete account, export data) require a fresh OTP (<5 min) even when a session is valid.

#### AUTH-07 · Account recovery — P1
- **AC1** Recovery is by verified phone OTP only. There is no "security question" and no email-only reset.
- **AC2** If the phone number is lost, recovery requires a support ticket + ID re-verification; the account is frozen for 72h and all sessions revoked.

#### AUTH-08 · Staff authentication — P1
- **AC1** Staff accounts are separate from user accounts, password + mandatory TOTP, Argon2id hashing, and a 30-minute idle timeout.
- **AC2** Staff login is restricted to allowlisted IP ranges/VPN where feasible, and always rate-limited and alerting on failure bursts.
- **AC3** No staff account can impersonate a user or read chat content without an approved, logged break-glass action (two-person approval for message content).

### 5.2 Profile

#### PROF-01 · Core profile — P1
*As a student I want a profile that shows who I am without exposing my contact details.*

- **AC1** Required to appear in search: display name (first name or nickname), gender, DOB, university, campus, department, year of study, expected graduation year, city, relationship intent, at least 1 approved photo, and ≥1 interest.
- **AC2** Display name cannot contain a phone number, email, social handle, or URL (regex + normalisation check). Bio is limited to 500 characters and screened for contact details.
- **AC3** Department is chosen from a per-university list with free-text fallback; year is 1–6; graduation year is current year .. current+7.
- **AC4** The profile shows a completeness meter with actionable next steps; the meter never blocks saving.
- **AC5** Profile edits are rate-limited (10/day); every edit writes before/after values to the append-only audit log for abuse review.

#### PROF-02 · Values and lifestyle — P1
- **AC1** Fields: religion, importance of religion (1–5), family expectations (free text, 300 chars), study-abroad plan (`yes/maybe/no` + target country optional), relocation after marriage (`stay in BD / open / must relocate`), mother tongue, smoking, drinking, dietary preference.
- **AC2** Every field is optional except relationship intent; users can mark any field "prefer not to say", which is treated as a non-match signal, not a mismatch.
- **AC3** Religion and religious practice are never shown to unverified users and can be hidden from the public profile while still used in matching (user choice, default: shown to matches only).

#### PROF-03 · Photos and privacy — P1
- **AC1** 1–6 photos; JPG/PNG/WebP; max 8 MB upload, re-encoded server-side to ≤300 KB at 1080px longest edge.
- **AC2** All photos are blurred (Gaussian, server-rendered preview) until a mutual match. The unblurred original is only served via a short-lived signed URL (≤5 min) to authorised viewers.
- **AC3** Every served photo carries a tiled, low-opacity watermark with the viewer's user ID and timestamp; the watermark is burned into the delivered image, not CSS.
- **AC4** EXIF, GPS, and device metadata are stripped before storage; the original upload is deleted from the quarantine bucket within 24h.
- **AC5** Reordering and deletion are immediate in the UI; deleted photos stop being served instantly and are purged from storage within 30 days.
- **AC6** A photo can be flagged "private" — visible only to mutual matches, never in search cards.

#### PROF-04 · Completeness meter — P1
- **AC1** Score = weighted sum of required fields, photos, interests, values, and preferences; shown as a percentage with the top 3 missing items.
- **AC2** Profiles below 60% are excluded from daily matches (but still searchable) and see a nudge explaining why.

#### PROF-05 · Partner preferences and dealbreakers — P1
- **AC1** Preferences: age range (18–40), university multi-select, city, department, year, intent, graduation year range, religion, maximum distance (campus-based), and 3 dealbreakers chosen from a fixed list.
- **AC2** Preferences are never shown to other users, in whole or in part.
- **AC3** A preference that would empty the pool (e.g. age 18–18) triggers a warning and a suggested widening, not a silent empty state.
- **AC4** Changing preferences refreshes daily matches on the next cycle; the user is told when.

#### PROF-06 · Edit rules and immutability — P1
- **AC1** University, campus, DOB, and gender are locked after verification; changing them requires re-verification.
- **AC2** Name and photo changes on a verified account are queued for light moderation (auto-approved unless flagged) and logged.

#### PROF-07 · Visibility controls — P1.5
- **AC1** "Hide me from my university" excludes the user from search and daily matches for users at that university, and vice versa.
- **AC2** Incognito mode (premium) hides the user from search but lets them browse and send interests; the recipient sees the interest with a "hidden profile" label until acceptance.
- **AC3** A user can always see a preview: "what others see when they find me".

### 5.3 Matching and search

#### MATCH-01 · Filtered search — P1
- **AC1** Filters: university, campus, city, department, year of study, graduation year (±1), relationship intent, interests (up to 5), verification level, active-in-last-30-days.
- **AC2** Results exclude: self, blocked (both directions), already-interacted (unless "show all"), hidden-by-preference, incomplete (<60%), unverified, suspended, and hidden-by-university (P1.5).
- **AC3** Results are keyset-paginated, 20 per page, max 200 results per query per user per day; no total count is exposed.
- **AC4** Each card shows: photo (blurred unless matched), first name, age, university, department, year, intent, up to 3 shared interests, and a compatibility score.
- **AC5** Search is rate-limited to 60 requests/min/user and 300/hour/IP; automated patterns trigger a challenge, then a temporary block.
- **AC6** Empty states explain which filter is likely too narrow and offer a one-tap widen.

#### MATCH-02 · Daily curated matches — P1
- **AC1** Every eligible user receives 6 matches per day at 06:00 Asia/Dhaka; matches are stable for the day and expire at 23:59.
- **AC2** A profile cannot appear in the same user's daily matches more than once in 14 days, and never if either side declined the other.
- **AC3** Each card explains "why you match" with 2–4 concrete factors (e.g. "Both want marriage after graduation", "3 shared interests", "Same campus").
- **AC4** If fewer than 3 eligible candidates exist, the user sees an honest message and is offered filter widening — never filler or out-of-preference profiles.
- **AC5** Users can send an interest directly from a daily match; doing so consumes the daily interest allowance.
- **AC6** Daily matches are precomputed in batch, so the screen renders from a single indexed read (p95 < 150 ms).

#### MATCH-03 · Compatibility score — P1
- **AC1** Score 0–100, computed from explainable factors only: intent alignment (25), values alignment (20), timeline alignment (15), shared interests (15), campus/city proximity (15), profile completeness & activity (10).
- **AC2** Hard filters (gender preference, age range, dealbreakers, blocks) run before scoring; a hard-filtered profile can never be shown regardless of score.
- **AC3** The breakdown is user-readable, in Bangla and English, and never reveals the other person's private answers (only "aligned / partially aligned / differs").
- **AC4** Score version (`model_version`) is stored with each match so results are reproducible and A/B-testable.

#### MATCH-04 · Campus modes — P1
- **AC1** "My campus" limits results to the user's campus; "Nearby campuses" uses a curated city/campus adjacency list (not GPS).
- **AC2** The mode is visible in the search header and defaults to "My campus" for the first 14 days.

#### MATCH-05 · Shortlist and saved searches — P1 (shortlist), P1.5 (saved search)
- **AC1** Shortlist is private, capped at 50, and shows the other user nothing.
- **AC2** Saved searches store filters + a name; alerts (P1.5) are sent at most once per day and respect notification preferences.

#### MATCH-06 · Anti-scraping and anti-enumeration — P1
- **AC1** Public user IDs are random 12-char opaque strings, not sequential or derivable.
- **AC2** Any profile view is logged; >150 distinct profile views/hour triggers a soft block and a security event.
- **AC3** Image URLs are signed per viewer, expire in 5 minutes, and are bound to the requesting user so a shared URL fails for anyone else.
- **AC4** No endpoint returns bulk user data, and CSV/JSON export of other users does not exist.

### 5.4 Interaction

#### INT-01 · Send interest — P1
- **AC1** Free users get 5 interests/day (reset 00:00 Asia/Dhaka); premium later 25/day. The counter is server-side and shown before sending.
- **AC2** One active interest per sender→receiver pair; re-sending after expiry (>14 days) is allowed.
- **AC3** An interest includes an optional 200-character note, screened for contact details and abuse.
- **AC4** Receiver sees the sender's full profile (photo unblurred only after mutual accept) and can accept, decline, or block.
- **AC5** Sender is notified on accept/decline; a decline is never explained and never re-notified.
- **AC6** Interests expire after 14 days, freeing the slot.

#### INT-02 · Accept / decline — P1
- **AC1** Accept creates a match and a conversation atomically (single transaction), then notifies both users.
- **AC2** Decline is silent to the sender beyond "not accepted"; it also hides the pair from each other's search for 90 days.
- **AC3** A user can accept at most 10 interests/day (anti-harassment and anti-spam throttle).

#### INT-03 · Chat unlock — P1
- **AC1** No conversation exists before mutual acceptance; the API returns 403 for any conversation not backed by an active match.
- **AC2** Either side can unmatch, which ends the conversation immediately for both, revokes media access, and offers a reason code (private).
- **AC3** Matches with no message in 7 days get a single gentle nudge and then auto-archive after 30 days.

#### INT-04 · Chat features — P1
- **AC1** Text messages ≤1000 characters, Bangla/English/emoji, with server-assigned monotonic sequence numbers per conversation.
- **AC2** Messages appear optimistically with a client ID; retries are idempotent (unique `conversation_id + sender_id + client_id`).
- **AC3** Delivery and read state are shown; typing indicators are ephemeral and never stored.
- **AC4** Two conversation prompts are shown when a chat is empty (drawn from shared interests/values).
- **AC5** Blocking or reporting is available from the chat header and from long-press on any message.
- **AC6** Contact-detail detection (phone/email/WhatsApp/Telegram patterns) shows the sender a warning before sending and flags the message for review if sent repeatedly.
- **AC7** Messages are not end-to-end encrypted in P1 (safety/moderation requirement); this is stated plainly in the privacy policy and in-chat info sheet.

#### INT-05 · Voice notes and video calls — P2
- **AC1** Voice notes ≤60s, recorded in-app, moderated asynchronously, and blocked from download.
- **AC2** Video calls use a vendor WebRTC SDK; no recording, no screen share, and both parties must consent before the call connects. Calls are never available before a mutual match.
- **AC3** Video calls are captioned/live-transcribed where the vendor supports it (accessibility).

#### INT-06 · Block and report everywhere — P1
- **AC1** Block is one tap from profile, match card, chat header, and message long-press. Blocking is symmetric immediately and hides both users from each other everywhere.
- **AC2** Reporting opens a category picker (fake profile, harassment, underage, nudity, scam, spam, other) + optional description + optional message selection.
- **AC3** Report submission returns a case reference and the expected response time; the reporter is never told the outcome details.
- **AC4** The reported user is not notified and cannot infer the reporter from any UI change.

#### INT-07 · Unmatch — P1
- **AC1** Unmatch removes the conversation from both inboxes and revokes signed media URLs; the other user sees "This match has ended" with no reason.
- **AC2** The unmatched pair cannot re-match for 90 days.

### 5.5 Privacy and safety

#### SAFE-01 · Block — P1
- **AC1** Blocking takes effect within 1 second across search, daily matches, chat, and notifications.
- **AC2** The blocked user cannot create a new account with the same phone number without human review (soft block).

#### SAFE-02 · Reports and moderation SLA — P1
- **AC1** Priority routing: underage and nudity/CSAM = P0 (triage < 2h, action < 24h); harassment/threats = P1 (< 24h); scam/spam/fake = P2 (< 72h).
- **AC2** Every report creates a case with an immutable evidence snapshot (message IDs, profile version, photo hashes) so later edits cannot erase the evidence.
- **AC3** Repeat-offender logic: 3 upheld P2 reports in 90 days = temporary suspension; 1 upheld P0 = immediate suspension pending review.
- **AC4** CSAM or credible threats are escalated to law enforcement per the incident runbook, with legal sign-off; staff never download or forward such material outside the controlled review tool.
- **AC5** Users can appeal a suspension within 14 days; appeals are reviewed by a different moderator.

#### SAFE-03 · Photo protection — P1
- **AC1** Right-click/save is disabled, download is blocked, and images are served with `Content-Disposition: inline`, no-store cache headers, and short-lived signed URLs.
- **AC2** Viewer-specific watermarking is applied to every photo served.
- **AC3** A "this photo was shared without consent" report path triggers a 24h takedown SLA and a hash-based block on re-upload.
- **AC4** The app clearly states that screenshots cannot be technically prevented on the web; deterrence + fast takedown is the honest promise.

#### SAFE-04 · Image moderation — P1
- **AC1** Every uploaded image passes automated nudity/abuse/weapon/drug screening in a queue before it becomes visible.
- **AC2** Auto-reject only for high-confidence nudity/sexual content; everything else goes to human review within 24h.
- **AC3** Perceptual hashes are stored to detect re-upload of banned images and cross-account reuse (catfishing signal).
- **AC4** Moderation labels and scores are retained with the decision, not with the image.

#### SAFE-05 · Fake profile and catfish detection — P1
- **AC1** Signals: duplicate photo hash, duplicate face embedding across accounts (consent-based, deleted after verification), mismatched university/ID, rapid profile rewrites, contact-detail spam, report velocity.
- **AC2** 2+ strong signals place the account in a review queue; the account keeps working until a human decides (avoid false-positive lockouts).
- **AC3** Face embeddings are used only for duplicate detection and verification, never for search, and are deleted within 24h of the verification decision.

#### SAFE-06 · Safe meeting guidance — P1
- **AC1** After a match, a dismissible safety card links to: meet in public, tell a friend, video-call first, never send money, how to report.
- **AC2** Any message containing money-transfer keywords (bKash, Nagad, "send money", "loan") triggers an inline scam warning to the recipient.

#### SAFE-07 · Consent and policies — P1
- **AC1** Separate, unbundled consent for: terms, privacy policy, biometric processing (verification), marketing. Declining marketing never blocks use.
- **AC2** Consent versions are stored with timestamp and IP hash; policy changes require re-consent for material changes.

#### SAFE-08 · Data export and deletion — P1
- **AC1** Export produces a machine-readable archive (JSON + media) within 30 days, delivered via a 24h signed link.
- **AC2** Deletion: immediate deactivation, 30-day grace period, then hard delete/anonymise. Backups age out within 35 days; this residual is disclosed.
- **AC3** Deletion removes photos, messages (both sides), verification artifacts, and push tokens; financial records are retained only as required by law.
- **AC4** Deletion and export requests are tracked with SLA timers and appear in the admin console.

#### SAFE-09 · Breach and incident communication — P1
- **AC1** A named incident commander, a 72h internal notification target, and a user notification template exist before launch.
- **AC2** A public status page and a security.txt / responsible-disclosure page are live at launch.

### 5.6 Monetization (Phase 2 — specified now, built later)

#### MON-01 · Plans — P2
- **AC1** Free: 5 interests/day, 6 daily matches, search, chat. Premium (100–300 BDT/month): 25 interests/day, see who liked you, 1 boost/week, incognito, advanced filters.
- **AC2** Entitlements are server-enforced; the client never decides access.

#### MON-02 · Payments — P2
- **AC1** bKash, Nagad, and cards via SSLCommerz (single aggregator integration to start). Webhooks are signature-verified, idempotent, and reconciled nightly.
- **AC2** No card data touches our servers; no storing of payment credentials.
- **AC3** Refunds and failed-payment recovery follow a documented policy; every transaction is auditable.

#### MON-03 · Campus partnerships — P2
- **AC1** Partner codes grant time-boxed premium without payment; redemption is capped per campus and reported to the partner only in aggregate.

### 5.7 Notifications

#### NOTIF-01 · Channels and preferences — P1
- **AC1** Push (web push), email, and SMS; per-category toggles (new match, new interest, new message, verification, safety, marketing).
- **AC2** Marketing is opt-in and never sent over SMS by default.
- **AC3** SMS is reserved for authentication and safety-critical events (cost control).

#### NOTIF-02 · Delivery — P1
- **AC1** Notifications are queued, retried with backoff, deduplicated per event, and dropped if the user is already active in the app.
- **AC2** Message notifications contain no message content by default (lock-screen privacy), only "New message from your match".
- **AC3** Quiet hours (22:00–07:00) suppress non-critical push unless the user opts out.

#### NOTIF-03 · Unsubscribe — P1
- **AC1** Every email has a one-click unsubscribe that works without login; push can be disabled per device.

### 5.8 Admin and moderation panel

#### ADMIN-01 · Verification queue — P1
- **AC1** Queue sorted by SLA risk, with filters by university and age of request.
- **AC2** Reviewer sees redacted documents, a face-match score, and prior decisions; approve/reject/request-resubmission requires a reason code.
- **AC3** Every action writes an audit record (actor, action, target, before/after, IP hash, request ID).
- **AC4** Reviewers cannot see phone numbers or full names; a separate "sensitive access" role is required for that, with two-person approval and alerting.

#### ADMIN-02 · Report queue — P1
- **AC1** Case view shows reporter, reported user, evidence snapshot, prior history, and suggested action.
- **AC2** Actions: dismiss, warn, remove content, suspend (1/7/30 days), ban, escalate to law enforcement. Every action requires a note.
- **AC3** Bulk actions are limited to 50 cases and require a second confirmation.
- **AC4** SLA timers and breach alerts are visible on the dashboard.

#### ADMIN-03 · User management — P1
- **AC1** Search by opaque user ID, phone last-4, or email domain; results are masked by default.
- **AC2** Suspend/ban/unban with reason, duration, and notification to the user.
- **AC3** No admin can edit another admin's role; role changes require super-admin + audit entry.

#### ADMIN-04 · Roles and access — P1
Roles: `support`, `moderator`, `senior_moderator`, `admin`, `super_admin`. Least privilege, mandatory TOTP, 30-min idle timeout, IP allowlist for `admin`+.

#### ADMIN-05 · Audit log — P1
- **AC1** Append-only (DB trigger blocks UPDATE/DELETE), 2-year retention, exportable by super-admin.
- **AC2** Logged: logins, verification decisions, content access, bans, role changes, exports, feature-flag changes, break-glass access.

#### ADMIN-06 · Analytics — P1
- **AC1** Daily: signups, verification funnel, DAU/WAU, matches, messages, reports by category, gender ratio per campus, retention cohorts.
- **AC2** No individual-level browsing history is shown to staff outside an active case.

### 5.9 Platform and data

#### DATA-01 · Bangla/English — P1
- **AC1** Full UI, emails, SMS, and push in both languages; language switch persists per account and per device.
- **AC2** Bangla uses a self-hosted, subset Noto Sans Bengali; numerals can be displayed in Bangla or Latin (user choice).
- **AC3** User-generated Bangla text is stored and rendered correctly (UTF-8, NFC normalisation, no truncation mid-grapheme).

#### DATA-02 · PWA — P1
- **AC1** Installable, maskable icons, standalone display, offline shell with a clear offline page.
- **AC2** Cached content is limited to the app shell and the user's own daily matches (read-only); no other user's data is persisted.
- **AC3** Update flow: new version detected → "Refresh to update" toast, never a silent hard reload mid-chat.

#### DATA-03 · Analytics and privacy — P1
- **AC1** First-party, cookie-less product analytics; no third-party ad pixels; IP addresses are truncated before storage.
- **AC2** Analytics events never contain message bodies, phone numbers, or photos.

---

## 6. Non-functional requirements

| Category | Requirement | Target | How we verify |
|---|---|---|---|
| Performance | API latency | p95 < 300 ms, p99 < 800 ms (server-side) | Load test + RUM |
| Performance | Web vitals on mid-range Android / 4G | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 | Lighthouse CI + field data |
| Performance | Slow 3G usability | First meaningful screen < 5 s; initial JS < 170 KB gzip | Throttled device lab |
| Availability | Uptime | 99.9% monthly (43 min downtime) | Synthetic checks, status page |
| Reliability | RPO / RTO | RPO ≤ 5 min (PITR), RTO ≤ 4 h | Quarterly restore drill |
| Security | Standard | OWASP ASVS L2, OWASP Top 10 | Checklist + pen test |
| Security | Auth | Access token 10 min, refresh 30 days rotating with reuse detection | Integration tests |
| Privacy | Retention | KYC docs ≤ 24 h post-decision; messages 24 months from creation | Automated purge job + audit |
| Accessibility | WCAG | 2.2 AA | axe CI + manual NVDA/TalkBack/VoiceOver |
| i18n | Coverage | 100% of user-facing strings in bn + en | CI check for missing keys |
| Compatibility | Devices | Android 8+, iOS 15+, Chrome/Safari/Firefox last 2 versions | Device matrix |
| Observability | Tracing | 100% of API requests traced; errors → Sentry | Dashboards |
| Capacity | Launch | 5,000 registered / 800 DAU / 50 msg/s peak with headroom ×5 | Load test at 5× |

---

## 7. Success metrics

**North star:** verified users who have a conversation with ≥5 messages from each side per week.

| Funnel | Metric | MVP target (first 90 days) |
|---|---|---|
| Acquisition | Signup → phone verified | ≥ 85% |
| Activation | Signup → fully verified + profile ≥ 60% within 48h | ≥ 40% |
| Supply | Verified profiles per campus | ≥ 600 per campus |
| Matching | Daily-match open rate | ≥ 45% |
| Interaction | Interest sent → accepted | ≥ 25% |
| Conversation | Matches with ≥1 reply within 48h | ≥ 55% |
| Retention | D7 / D30 | ≥ 35% / ≥ 18% |
| Balance | Gender ratio per campus | 45–55% women |
| Trust | Reports per 1,000 DAU | < 8 |
| Trust | P0 report triage within SLA | 100% |
| Trust | Verification decision within 48h | ≥ 95% |

**Guardrails (any breach pauses growth spend):** any confirmed minor account; any confirmed data breach; P0 triage SLA < 95%; women's D7 retention falling below 25%.

---

## 8. Definition of done and launch gates

A feature is done when: acceptance criteria pass in staging, unit + integration tests exist, bn/en strings are complete, axe reports zero critical issues, analytics events fire, the runbook is updated, and a rollback path exists.

**Launch gates (all mandatory):**
1. Pen test complete; no open critical/high findings.
2. Restore-from-backup drill passed; RPO/RTO measured.
3. Accessibility audit with real screen-reader users passed.
4. Moderation team staffed for 7-day coverage with < 48h verification SLA.
5. Legal review of terms, privacy policy, and data flows signed off.
6. Load test at 5× expected peak passed.
7. Incident response plan rehearsed (tabletop).
8. 200+ verified profiles seeded per campus before public launch (see item 9).

---

## 9. Assumptions (confirm or correct)

| # | Assumption | Impact if wrong |
|---|---|---|
| A1 | Launch city is **Dhaka**, first two campuses are one large public university + one large private university | Campus list, seed strategy, moderation language mix |
| A2 | Team is 5–7 people (2 full-stack, 1 designer, 1 PM, 1 moderator lead, part-time DevOps/security) | Timeline and cost in item 7 |
| A3 | Budget is seed-stage, ≤ USD 3k/month infra + tooling at launch | Managed-service choices |
| A4 | Consumer accounts are passwordless (phone OTP); Argon2id applies to staff and optional passwords | Auth scope |
| A5 | Premium/payments are Phase 2, not launch | Revenue timing |
| A6 | No minors, no casual-dating positioning, no third-party ad tracking | Product/marketing |
| A7 | English + Bangla only at launch; no other languages | i18n scope |
| A8 | Legal entity will be registered in Bangladesh before taking payments | Payments phase |
| A9 | Moderation is human-in-the-loop; no fully automated banning for anything except CSAM hash matches | Safety design |
| A10 | "Verified Campus" means the ID review confirms the campus, not that we query the university registry | Badge meaning |

---

## 10. Open questions (blocking)

1. **City and first two universities?** This changes the seed plan, the department lists, and the gender-balance strategy.
2. **Budget and timeline?** Do you have a hard launch date (e.g. before a semester start)? That drives MVP cut depth.
3. **Entity and payments:** is there a registered company, and who will hold the SSLCommerz/bKash merchant accounts?
4. **Age assurance depth:** are you willing to require NID (or birth-certificate) for the 18–18.5 borderline group, or accept student-ID-only assurance for MVP?
5. **Moderation staffing:** in-house part-time reviewers or an outsourced trust & safety vendor? This is the largest recurring cost.
6. **Video calls:** is a third-party WebRTC vendor acceptable (data processor outside Bangladesh), or must calls stay in-country?
7. **Gender model:** binary (woman/man) for matching with an optional "prefer not to say" display, or a broader set? This affects matching logic and legal review.
