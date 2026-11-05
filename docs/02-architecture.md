# CampusMatch BD — System Architecture

| | |
|---|---|
| **Version** | 0.1 |
| **Date** | 2026-11-01 |
| **Style** | Modular monolith, single deployable API + separate worker and WebSocket processes |
| **Cloud** | AWS `ap-south-1` (Mumbai), 3 AZs; DR copy in `ap-southeast-1` (Singapore) |

---

## 1. Architecture principles

1. **One database, one repository, one deploy.** Modules are separated by code boundaries and PostgreSQL schemas, not by network calls. This keeps transactions simple (match + conversation creation must be atomic) and ops cheap.
2. **Async by default for anything slow.** Image scanning, notifications, emails, SMS, daily match generation, exports, and deletions go through a queue. A request never waits on a third party.
3. **The API is the only trust boundary.** Every authorization decision happens server-side; the PWA is treated as hostile.
4. **Two storage planes.** User media and identity documents are never in the same bucket, never share a policy, and never share a CDN.
5. **Design for the split, don't build it.** Chat and Media are the two modules most likely to leave the monolith. They already communicate only through interfaces + domain events, so extraction is a transport change, not a rewrite.
6. **Buy the undifferentiated parts.** Managed Postgres, managed Redis, managed KMS, managed moderation API. Custom code is reserved for matching, trust, and the campus experience.

---

## 2. System context

```mermaid
flowchart TB
    subgraph Users
        S["Student<br/>(mobile browser / installed PWA)"]
        M["Moderator / Admin<br/>(desktop console)"]
    end

    subgraph Platform["CampusMatch BD (AWS ap-south-1)"]
        WEB["Next.js PWA<br/>(SSR + static)"]
        API["NestJS API<br/>REST + WS"]
        WRK["Worker<br/>(BullMQ consumers)"]
        PG[("PostgreSQL 16<br/>Multi-AZ + replica")]
        RD[("Redis<br/>cache / sessions / queues")]
        S3M[("S3: media bucket<br/>private")]
        S3K[("S3: KYC bucket<br/>locked down")]
    end

    subgraph External["Third parties"]
        SMS["SMS aggregator<br/>(BD sender ID)"]
        MAIL["SES / email"]
        MOD["Image moderation API"]
        PUSH["Web Push (VAPID)"]
        PAY["SSLCommerz / bKash / Nagad<br/>(Phase 2)"]
        OBS["Sentry + Grafana Cloud"]
    end

    S -->|HTTPS| CDN["CloudFront + WAF + Shield"]
    M -->|HTTPS| CDN
    CDN --> WEB
    CDN --> API
    WEB -->|internal HTTP| API
    API --> PG
    API --> RD
    API --> S3M
    API --> S3K
    API -->|enqueue| RD
    WRK -->|consume| RD
    WRK --> PG
    WRK --> S3M
    WRK --> S3K
    WRK --> SMS
    WRK --> MAIL
    WRK --> MOD
    WRK --> PUSH
    API -.->|webhooks| PAY
    API --> OBS
    WRK --> OBS
```

**Trust boundaries:** the browser (untrusted), the CDN/WAF (semi-trusted), the VPC (trusted), the KYC bucket (restricted, separate KMS key, separate IAM role, access logged per object).

---

## 3. Container / deployment view

```mermaid
flowchart LR
    subgraph Edge["Edge"]
        R53["Route 53"]
        CF["CloudFront<br/>WAF · Shield Standard · rate rules"]
    end

    subgraph VPC["VPC · 3 AZ · private subnets"]
        ALB["ALB (TLS 1.2+)"]
        subgraph ECS["ECS Fargate services"]
            W["web<br/>Next.js standalone<br/>2–6 tasks"]
            A["api<br/>NestJS REST<br/>2–10 tasks"]
            WS["ws<br/>NestJS Socket.IO<br/>2–6 tasks"]
            K["worker<br/>BullMQ consumers<br/>1–4 tasks"]
            C["cron<br/>EventBridge → one-off tasks"]
        end
        RDS[("RDS PostgreSQL 16<br/>Multi-AZ + 1 read replica")]
        EC[("ElastiCache Redis<br/>Multi-AZ · AOF")]
    end

    subgraph Storage["Storage & secrets"]
        SM["Secrets Manager"]
        KMS["KMS (2 keys: app, KYC)"]
        S3M[("media bucket")]
        S3K[("kyc bucket<br/>no CDN · Object Lock on audit copies")]
    end

    R53 --> CF
    CF --> W
    CF --> A
    CF --> WS
    W --> A
    A --> RDS
    A --> EC
    WS --> EC
    WS --> RDS
    K --> RDS
    K --> EC
    K --> S3M
    K --> S3K
    A --> S3M
    A --> SM
    A --> KMS
    CF -->|signed URL redirect| S3M
```

### Why these choices

| Decision | Choice | Why | Rejected alternative |
|---|---|---|---|
| Compute | **ECS Fargate** | No cluster to operate, per-second billing, rolling + blue/green via CodeDeploy, simple autoscaling on ALB request count | EKS (ops overhead at this team size), Lambda (cold starts, 15-min cap, WS pain), EC2 (patching burden) |
| API framework | **NestJS 11 + Fastify adapter** | Modules/DI map cleanly to the modular monolith; guards/interceptors give one enforcement point for authz, validation, audit; Fastify ~2× throughput of Express | Django (fine, but one language across stack wins), plain Fastify (weak structure for 8 modules) |
| Frontend | **Next.js 15 App Router** | SSR for fast first paint on slow networks, RSC keeps JS small, image optimisation, first-class PWA support | SPA-only React (worse TTFB on 3G), Remix (smaller ecosystem) |
| ORM | **Prisma + raw SQL for search/matching** | Type-safe schema + migrations for 95% of queries; `$queryRaw` for FTS, scoring, keyset pagination | Drizzle (good, less mature migration story), TypeORM (weaker types) |
| DB | **RDS PostgreSQL 16, Multi-AZ** | ACID for match/chat invariants, JSONB for flexible filters, row-level security, `pg_trgm` + FTS, PITR | Aurora (2× cost at this size), MongoDB (no joins/transactions we need), MySQL (weaker JSON/FTS/RLS) |
| Cache/queue | **ElastiCache Redis 7 + BullMQ** | One system for cache, rate limits, sessions, and jobs; BullMQ has retries, backoff, cron, dedupe | SQS+SNS (great, but two more systems; revisit for critical notifications), RabbitMQ (heavier) |
| Realtime | **Socket.IO on a separate `ws` service with Redis adapter** | Sticky-session-free fan-out, fallback to long-polling on flaky mobile networks, room-per-conversation | Raw WS (no fallback), Pusher/Ably (cost at scale, data residency) |
| Media | **S3 private + CloudFront signed URLs** | No public objects; per-viewer expiry; cheap egress via CDN | Public buckets (never), Cloudinary (extra processor + cost, but viable Phase 2) |
| KYC docs | **Separate S3 bucket, separate KMS key, no CDN, 24h lifecycle** | Blast-radius isolation; a media-bucket misconfiguration cannot expose IDs | Same bucket with prefixes (insufficient isolation) |
| Search | **PostgreSQL now** | 600–5,000 profiles per campus; structured filters + trgm is plenty | OpenSearch at launch (cost + ops for no benefit) |
| IaC | **Terraform** | Team familiarity, mature AWS provider, easy review | CDK (fine, but Terraform is the safer hiring bet) |
| Email/SMS | **SES + local BD aggregator** | SES cheap for transactional email; local aggregator needed for alphanumeric sender ID + delivery | Twilio (3–5× SMS cost to BD) |

---

## 4. Module boundaries (the modular monolith)

```mermaid
flowchart TB
    subgraph App["apps/api/src"]
        direction TB
        KER["Kernel<br/>config · auth guards · validation ·<br/>outbox · audit · errors · i18n"]
        AUTH["Auth<br/>OTP · sessions · tokens"]
        VER["Verification<br/>email · student ID · selfie"]
        PROF["Profiles<br/>profile · photos · preferences"]
        MEDIA["Media<br/>upload · scan · transform · sign"]
        MATCH["Matching<br/>search · score · daily matches"]
        INT["Interests<br/>send · accept · decline · block"]
        CHAT["Chat<br/>conversations · messages · WS"]
        NOTIF["Notifications<br/>push · email · SMS"]
        MOD["Moderation<br/>reports · actions · appeals"]
        PAY["Payments (stub in P1)<br/>plans · entitlements"]
        ADMIN["Admin<br/>queues · users · audit read"]
    end

    AUTH --> KER
    VER --> KER
    PROF --> KER
    MEDIA --> KER
    MATCH --> KER
    INT --> KER
    CHAT --> KER
    NOTIF --> KER
    MOD --> KER
    PAY --> KER
    ADMIN --> KER

    VER --> AUTH
    PROF --> VER
    MEDIA --> PROF
    MATCH --> PROF
    INT --> MATCH
    CHAT --> INT
    MOD --> CHAT
    ADMIN --> MOD
    ADMIN --> VER
    NOTIF -.->|events| KER
```

**Rules enforced in CI (`dependency-cruiser`):**

- A module may import another module **only** through its `public/` barrel (`@/modules/profiles/public`). Repositories and entities are private.
- No module imports `admin` or `moderation` internals; admin reads via query services.
- Cross-module side effects use **domain events** through the transactional outbox, not direct calls, when the effect is not required for the current transaction.
- `kernel` imports nothing from modules.

**Schema-per-module in Postgres** (`identity`, `profile`, `matching`, `chat`, `moderation`, `billing`, `ops`) makes a future extraction a `pg_dump --schema` away and makes RLS grants easier to reason about. Cross-schema foreign keys are allowed now (single DB), but no cross-schema joins inside hot paths except through read models.

**Extraction triggers (documented, not built):**

| Module | Trigger to extract | First step |
|---|---|---|
| Chat | > 50k concurrent WS or > 2k msg/s, or chat deploys blocked by API deploys | Move `ws` + `chat` schema to its own service; keep REST read API in monolith |
| Media | > 100k uploads/day or scanning backlog > 15 min | Move pipeline to a dedicated worker fleet + event bus |
| Matching | Daily batch > 30 min or > 500k profiles | Precompute in a columnar store / OpenSearch |

---

## 5. Key flows

### 5.1 Signup and verification

```mermaid
sequenceDiagram
    autonumber
    participant U as Student (PWA)
    participant A as API
    participant R as Redis
    participant DB as Postgres
    participant Q as Queue
    participant S as SMS provider
    participant K as KYC bucket
    participant M as Moderator

    U->>A: POST /auth/otp/request {phone, dob}
    A->>A: validate E.164 + age >= 18
    A->>R: rate limit (phone, IP)
    A->>DB: upsert otp_challenge (HMAC of code)
    A->>Q: send_sms job
    Q->>S: SMS "Your code 123456"
    U->>A: POST /auth/otp/verify {phone, code}
    A->>DB: check hash, attempts, expiry
    A-->>U: access token (10m) + refresh cookie (30d rotating)
    U->>A: POST /verification/email/start {universityId}
    A->>DB: check domain allowlist
    A->>Q: send_email job (code/link)
    U->>A: POST /verification/email/confirm {code}
    A->>DB: user_verifications(email) + audit
    Note over U,A: If no usable email domain → student ID path
    U->>A: POST /media/upload-url {purpose: kyc, contentType}
    A->>DB: create verification_request + document row
    A-->>U: presigned POST (60s, size + type constrained)
    U->>K: direct upload (ID + selfie)
    K->>Q: S3 event → scan job
    Q->>Q: face match + liveness + dedupe hash
    Q->>DB: status = pending_review (or auto_reject on high-confidence)
    M->>A: GET /admin/verifications (SLA-sorted)
    M->>A: POST /admin/verifications/:id/decision {approve|reject, reason}
    A->>DB: decision + audit + user_verifications
    A->>Q: notify user + schedule KYC purge (T+24h)
    Q->>K: delete objects
    Q->>DB: documents.deleted_at, keep salted sha256 + decision
```

### 5.2 Media upload (user photos)

```mermaid
sequenceDiagram
    autonumber
    participant U as Client
    participant A as API
    participant S3Q as S3 quarantine
    participant Q as Queue
    participant W as Worker
    participant MOD as Moderation API
    participant S3P as S3 media (private)
    participant DB as Postgres
    participant CF as CloudFront

    U->>A: POST /media/upload-url {purpose: profile_photo, size, type}
    A->>DB: media_upload (status=initiated, owner)
    A-->>U: presigned POST (90s, key = u/{userId}/{uuid})
    U->>S3Q: PUT file
    S3Q->>Q: ObjectCreated event
    Q->>W: process_media
    W->>W: magic-byte check · EXIF strip · re-encode (sharp)<br/>· resize 3 variants · blurhash · pHash
    W->>MOD: moderation check (nudity/abuse/violence)
    alt high-confidence violation
        W->>DB: status=rejected, reason
        W->>S3Q: delete
    else clean or low confidence
        W->>S3P: put processed variants (SSE-KMS)
        W->>DB: profile_photos(status=approved|pending_review, phash)
        W->>S3Q: delete original
    end
    U->>A: GET /profiles/:id/photos/:photoId/url
    A->>A: authz (match? owner? privacy rule?)
    A-->>U: 302 → CloudFront signed URL (5 min, viewer-bound)
    U->>CF: GET image
    CF->>S3P: origin fetch (OAC)
```

**Non-negotiable:** the quarantine bucket has a 24h lifecycle rule; the media bucket blocks all public access and only CloudFront's OAC can read it; signed URLs include a custom policy with the viewer's user ID so a leaked URL is useless to another account.

### 5.3 Chat message

```mermaid
sequenceDiagram
    autonumber
    participant U as Client
    participant WS as ws service
    participant A as API
    participant DB as Postgres
    participant R as Redis
    participant Q as Queue
    participant N as Notifications

    U->>WS: emit message:send {conversationId, clientId, body}
    WS->>WS: JWT verify + rate limit (30/min/user)
    WS->>DB: INSERT message (idempotent on conversation+sender+clientId)
    DB-->>WS: message + seq
    WS->>R: publish to room conversation:{id}
    WS-->>U: ack {messageId, seq, serverTime}
    WS->>DB: UPDATE conversation.last_message_at (same tx)
    WS->>Q: message_created event
    Q->>Q: contact-detail / abuse scan (async)
    Q->>N: notify recipient (unless active in room)
    Note over U,WS: Reconnect → GET /conversations/:id/messages?afterSeq=N
```

**Design choices:**
- Messages are written to Postgres **before** fan-out; Redis is a transport, never the source of truth. A Redis flush loses nothing.
- `seq` is a per-conversation bigint from a Postgres sequence, so clients can detect gaps and resync.
- REST fallback `POST /conversations/:id/messages` exists for flaky networks and non-WS clients; both paths share the same service method.
- Not E2EE in P1 — required for abuse detection and legal compliance. Documented in-product.

### 5.4 Daily match generation (batch)

```mermaid
flowchart LR
    CRON["EventBridge 05:45 Dhaka"] --> JOB["BullMQ: daily_matches"]
    JOB --> S1["Load eligible users<br/>(verified, active 30d, >=60%)"]
    S1 --> S2["For each user: SQL candidate set<br/>hard filters + blocks + 14-day history"]
    S2 --> S3["Score in SQL<br/>(weights table, model_version)"]
    S3 --> S4["Pick top 6 with diversity rules<br/>(max 2 per department, no repeats)"]
    S4 --> S5["Bulk insert daily_matches"]
    S5 --> S6["Push notification 06:00"]
```

Batch size: 5k users × ≤500 candidates = 2.5M score rows — fine in SQL on a `db.r6g.large`, chunked 500 users per job. At 50k users, switch to a read replica and precomputed feature table.

---

## 6. Data architecture

| Store | Contents | Notes |
|---|---|---|
| PostgreSQL primary | All relational data, outbox, audit | Encrypted at rest (RDS KMS), TLS in transit, `pgcrypto` available but app-level envelope encryption used for phone/email |
| Read replica | Admin analytics, exports, heavy search | Lag-tolerant reads only |
| Redis | Sessions (jti denylist), rate limits, cache (profile cards, daily matches), BullMQ | AOF everysec; **no PII** in cache keys or values beyond opaque IDs |
| S3 media | Processed photos, chat attachments (P2) | SSE-KMS, versioning off, lifecycle to IA after 90 days |
| S3 KYC | ID/selfie uploads | Separate account-level bucket policy, no CDN, 24h lifecycle, access logging |
| OpenSearch | *Not used in P1* | Introduced when free-text search or >100k profiles demand it |

**Field-level encryption.** Phone and email are stored twice: `*_enc` (AES-256-GCM, envelope key from KMS, per-row IV) and `*_hmac` (HMAC-SHA256 with a separate pepper) for equality lookup and uniqueness. DOB is stored in plaintext because age filtering and matching require range queries; access is restricted by role and never returned raw by the API (only derived age). See `03-data-model.md` §7 for the data classification table.

---

## 7. Security architecture (summary — full checklist in item 5)

- **Edge:** CloudFront + AWS WAF (managed rule groups: OWASP, bot control, IP reputation), Shield Standard, geo/IP rate rules, 10 MB body cap, request body inspection on auth routes.
- **AuthN:** phone OTP → short-lived JWT (10 min, `jti`, `sid`, `ver`) + opaque rotating refresh token (30 days, hashed at rest, reuse detection revokes the family). Refresh token in `HttpOnly; Secure; SameSite=Lax` cookie scoped to `/api/v1/auth`, plus a double-submit CSRF token for state-changing requests. Staff: password (Argon2id, m=64MB, t=3) + TOTP.
- **AuthZ:** every route declares a policy (`@Policy('conversation:read')`); a central `PolicyGuard` resolves `(actor, resource, action)` and denies by default. Resource ownership is checked in the service layer too (defence in depth), never trusted from the URL alone.
- **RLS:** enabled on `chat.messages`, `chat.conversations`, `profile.profile_photos`, `identity.verification_documents`, `moderation.reports`. The API connects as a non-owner role; each request transaction runs `SET LOCAL app.user_id = ...`. Admin/worker roles bypass RLS explicitly. Details in `03-data-model.md` §6.
- **Secrets:** Secrets Manager + IAM task roles; no secrets in env files, no secrets in the Next.js bundle; rotation runbook for DB, JWT keys (kid-based), SMS, moderation API.
- **Uploads:** presigned POST with content-length-range and content-type conditions; magic-byte validation; re-encode everything; strip EXIF; ClamAV scan; no SVG; no PDF for user media.
- **Headers:** strict CSP (`default-src 'self'`, nonce-based script-src, `img-src` limited to CDN + `data:` for blurhash), HSTS 1 year, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic except on the verification and call routes, COOP/CORP.
- **Audit:** append-only `ops.audit_logs`, written by an interceptor + explicit domain events; includes request ID so it can be joined to traces.

---

## 8. Reliability and operations

| Concern | Approach |
|---|---|
| Multi-AZ | RDS Multi-AZ, ElastiCache Multi-AZ, ECS tasks spread across 3 AZs, ALB cross-zone |
| Health | `/health/live` (process) and `/health/ready` (DB + Redis + queue depth); ALB uses ready |
| Autoscaling | API on CPU 60% + ALB requests/target 800; WS on connection count; worker on queue depth |
| Deploy | Immutable ECR image (digest pinned), ECS rolling with `minimumHealthyPercent=100`, circuit breaker + auto-rollback; blue/green for schema-coupled releases |
| Migrations | Expand → migrate → contract. Every migration backward compatible with the previous app version; no destructive change in the same release |
| Backups | RDS automated daily + PITR 35 days; cross-region snapshot copy nightly; S3 versioning off but KYC purge is audited; quarterly restore drill into an isolated account |
| DR | RPO ≤ 5 min (PITR), RTO ≤ 4 h (restore + DNS failover runbook). Warm standby is a Phase 2 cost decision |
| Degradation | SMS down → voice OTP fallback + queue retry. Moderation API down → uploads held `pending`, user sees "under review". Redis down → API serves read-only cached paths, chat falls back to REST polling, rate limits fail closed on auth routes |
| Observability | OpenTelemetry traces → Grafana Tempo; metrics → CloudWatch + Grafana; errors → Sentry (PII scrubbed); logs JSON, 30-day retention, no message bodies; synthetic checks from Dhaka + Singapore every minute; public status page |
| Alerts | Page: 5xx > 1% for 5 min, p95 > 1s for 10 min, queue depth > 5k for 15 min, RDS failover, KYC purge failure, moderation backlog > 2h, auth failure spike, WAF block spike |

**SLOs:** API availability 99.9%; chat message delivery p95 < 500 ms; verification decision p95 < 48h; report P0 triage p95 < 2h; image processing p95 < 60 s.

---

## 9. Environments and delivery

| Env | Purpose | Data | Access |
|---|---|---|---|
| `local` | Dev | Docker Compose (Postgres, Redis, MinIO, MailHog) + seeded synthetic profiles | Developer laptop |
| `staging` | Pre-prod, mirrors prod topology at 1/4 scale | Synthetic + a small consented internal pilot set; **never** real KYC docs | Team + QA, SSO + IP allowlist |
| `prod` | Live | Real | Break-glass only, all actions audited |

Separate AWS accounts per env (Organizations + SCPs). Terraform state in S3 with DynamoDB locking; `plan` posted on every PR via OIDC (no long-lived AWS keys in CI).

**Pipeline (GitHub Actions):**

1. PR: lint, typecheck, unit, `dependency-cruiser` boundary check, i18n key parity, OpenAPI diff, Gitleaks, `osv-scanner`/`npm audit`, CodeQL, Terraform plan.
2. Merge to `main`: build images (SBOM + cosign), integration tests with Testcontainers, migration dry-run on a prod-like snapshot.
3. Auto-deploy staging → smoke + Playwright E2E + ZAP baseline → manual approval.
4. Prod: ECS rolling deploy, canary 10% for 10 min (ALB weighted target groups), auto-rollback on 5xx/latency; feature flags for risky surfaces.
5. Nightly: full E2E, dependency scan, DAST against staging, restore drill weekly.

---

## 10. What this architecture deliberately does *not* do

- No microservices, no service mesh, no Kafka. At 5k–50k users these add cost and failure modes without benefit.
- No E2EE chat in P1 (moderation and legal obligations win; revisit with a safety-preserving design in P3).
- No client-side-only authorization, no "admin" flag in a JWT that the client can influence.
- No public S3 objects, no long-lived signed URLs, no EXIF-bearing images.
- No third-party analytics that could deanonymise students.
- No cross-border KYC processing beyond the cloud region (Mumbai) without explicit consent and legal review.
