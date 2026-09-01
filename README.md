# FHQ Tech Ticket Tracker

## THE THESIS

FHQ Tech does not need another generic ticket list. It needs a school-aware operating system for a shared mailbox. The expensive work is not clicking “resolve”; it is reconstructing the request, finding the school, discovering who owns it, waiting for missing details, retyping familiar answers, and driving to a site without knowing what else could be fixed there. This product attacks those costs at intake.

The manager view answers three questions in five seconds: where the work is, what is likely to breach, and whether the team has capacity. The technician view ranks by predicted risk instead of age, keeps ownership visible, and places the next useful action beside the evidence that produced it. The staff experience remains email—no portal, no new behavior—and replaces silence with timely human-reviewed replies.

Mainstream tools miss this environment in predictable ways: Jira makes occasional requesters learn workflow language; Zendesk treats organization more naturally than physical school/site; Freshservice pulls teams toward asset-heavy ITSM; osTicket makes threading and analytics feel administrative; Spiceworks trades control and polish for convenience. Across them, site travel, bell schedules, affected classrooms, directory-derived routing, multi-problem teacher email, and recurrence at one physical room are second-class concepts.

Here, site and person are first-class, historically snapshotted facts. AI-derived content is visually distinct, traceable, optional, and never sent without a technician. Unknown and conflicting routing stays loud. Imports cannot delete history. The original email is preserved. The result is an operational command center shaped around six schools and three people—not corporate IT theatre.

## STACK + KEY DECISIONS

Next.js 16 App Router + strict TypeScript + Tailwind 4 + Framer Motion provide one responsive codebase with server-rendered reads and secure route handlers. PostgreSQL + Prisma 6.12 hold the immutable audit trail, historical attribution snapshots, email threads, directory versions, incidents, SLA models, knowledge, and automation.

Microsoft Graph webhooks are used instead of IMAP: they support Microsoft 365 application permissions, lifecycle renewal, MIME retrieval, stable IDs, and correctly threaded outbound replies. Attachments go to S3-compatible storage; metadata and OCR signals live in Postgres. ExcelJS replaces the vulnerable `xlsx` package. Zod, message size limits, HTML sanitization, CSV-injection defense, loop prevention, HMAC sessions, role checks, and rate limits are built in.

## DESIGN SYSTEM

Style: **Dark Editorial Command Center**—asymmetric editorial hierarchy married to dense operational tables. The FHQTC mark drives the product: black `#11100E`, warm gold `#E0A316`, bright gold `#F7C839`, red `#E52B46`, and warm paper `#F6F3EB`.

- Typography: Fraunces display + DM Sans body, with a clear display/body/label ladder.
- Space: 4px-based rhythm; page 34px, card 20px, control 38–42px.
- Radius: 8 / 14 / 22 / 30px. Elevation uses inset light plus deep low-opacity shadows.
- Motion: 180–300ms, exponential ease-out; layout transitions use restrained springs. Reduced-motion is fully respected.
- School colors: a harmonized muted palette (gold, clay, sage, blue, plum, rose). Color is always paired with a school code/name.
- Dark is default; light mode consumes the same semantic tokens. Comfortable and compact density persist per user.

## FEATURE LIST

- Email-only Graph intake; Message-ID deduplication, In-Reply-To/References welding, sanitized originals, loop/bounce defense, attachment quarantine, and threaded replies.
- Automatic person/site routing with exact, domain, display-name, body-signal, conflict, and unknown outcomes plus full rationale.
- Digest, structured extraction with provenance/confidence, asks, missing-info replies, raw-email toggle, feedback, graceful fallback, and recurrence action.
- Risk-ranked dashboard and queue, take/assign/status, site board, saved-view semantics, merge/split affordances, internal notes, live presence, timeline, command palette, and keyboard triage.
- Versioned directory, aliases, people/sites, attention queue, safe CSV/XLSX import with mapping/validation/diff, export, and rollback preview.
- Ripple incidents, blast radius, Recurrence DNA, knowledge drafts, Human/Tech reply modes, frustration signal, Time to Doom, workload, site runs, Waiting-On radar, handover, weekly reports, postmortems, and public status.
- Auth roles: Admin, Tech, Read-only. Directory administration is separated from technician re-routing.

Original inventions:

1. **Bell Window** — promotes a classroom problem when the predicted fix crosses the next class bell, not merely an arbitrary SLA.
2. **Drive-By Bundle** — while planning travel, reveals every quick win at that school so a trip resolves a cluster, not one email.
3. **Silence Debt** — ranks blocked tickets by how long staff have heard nothing and drafts an escalating, human-language update.
4. **Context Handback** — every site-run ticket carries room, bell, requester availability, and the last known fix in one walking view.

## DATA MODEL / SCHEMA

The complete indexed schema is in `prisma/schema.prisma`; the generated PostgreSQL migration is in `prisma/migrations/20260826000000_initial/migration.sql`.

Historical attribution is deliberately duplicated on `Ticket` (`siteNameAtIntake`, `siteCodeAtIntake`, `personNameAtIntake`, `requesterEmailAtIntake`, `roomAtIntake`) and optionally bound to `PersonSnapshot`. Re-importing or merging directory records cannot rewrite those fields. `AuditLog` is append-only at the application boundary and records actor, action, before/after, metadata, and time.

## THE FULL CODEBASE

The application is in `app/`, reusable surfaces in `components/`, domain and integration logic in `lib/`, persistence in `prisma/`, and automated checks in `tests/`. `public/sample-staff.csv` immediately exercises the import flow. There is intentionally no manual ticket creation route and no asset/inventory model.

## TESTS

Automated coverage includes:

- Routing: exact, domain, fuzzy suggestion, body conflict, unknown, ambiguous alias.
- Digest, triage, urgency/impact, Time to Doom, bell pressure, paused SLA, and ripple clustering.
- Threading: Message-ID dedup, ancestry, subject candidate, out-of-office/daemon loops, and 40 quote levels.
- Import: BOM, CRLF, semicolon delimiter, quoted comma, blank rows, flexible headers, duplicate rows, upsert/inactivation, zero hard deletes, and CSV formula defense.
- Ingest: route → digest → triage, empty body, duplicate, autoresponder, and forwarded affected-person conflict.
- Playwright: login; ticket triage → assign → reply → resolve; directory upload → mapping → validation → diff; keyboard-only triage; manual re-route with directory-learning prompt. Desktop Chromium and Pixel 7 projects are configured.

## RED TEAM — TEN BREAKS AND THE FIXES APPLIED

1. Duplicate webhook delivery creates two tickets → unique `internetMessageId` plus pre-ingest dedup.
2. Out-of-office mail loops forever → `Auto-Submitted`, precedence, daemon, and no-reply loop guard.
3. Same address belongs to two people → conflict outcome; never silently chooses.
4. Directory import rewrites old reports → immutable intake fields and snapshot relation.
5. Spreadsheet executes formulas on export → leading formula characters are apostrophe-neutralized.
6. Crafted XLSX/CSV exhausts the server → 25MB/5,000-row caps, nonrecursive parsing, validated mappings; vulnerable SheetJS removed.
7. Email body injects script → strict allowlist sanitization; raw MIME never renders directly.
8. Serverless returns before webhook work completes → Next `after()` keeps accepted processing alive after the fast 202.
9. Attachments disappear or bypass scanning → checksum, maximum size, quarantine-by-default when storage is unavailable.
10. Two technicians reply simultaneously → visible collision guard/presence contract; outbound reply is audited and remains human-triggered.

## FILE TREE

```text
app/                       Next.js routes, auth, status, webhooks, health, cron
components/                shell, dashboard, queue, ticket, board, directory, operations
lib/                       routing, digest, triage, SLA, threading, import, security, Graph
prisma/
  migrations/.../          initial PostgreSQL migration
  schema.prisma            complete relational schema
  seed.ts                  6 schools, 60 people, 200 realistic tickets
public/
  fhqtc-logo.png            supplied FHQTC mark
  sample-staff.csv          immediate importer test file
tests/                     28 unit/integration tests plus Playwright flows
```

## SETUP + DEPLOY

Requirements: Node 20.9+, PostgreSQL 15+, a Microsoft Entra app with Graph application permission `Mail.ReadWrite`, an externally reachable HTTPS URL, and S3-compatible object storage.

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Development login: `mihar@fhqtc.net` / `fhqtechdemo`. The demo password path is disabled automatically when `NODE_ENV=production` unless the test-only `ALLOW_DEMO_AUTH=true` flag is explicitly set; production identity must be backed by Entra ID.

Graph setup:

1. Set tenant/client credentials, mailbox, public `APP_URL`, webhook secret, cron secret, and storage variables.
2. Grant and admin-consent `Mail.ReadWrite` application permission to the Entra app; restrict mailbox scope with an Exchange application access policy.
3. POST `{}` to `/api/cron/graph-subscription` with `Authorization: Bearer $CRON_SECRET`; store the returned subscription ID.
4. Run the same endpoint every 48 hours with `{ "subscriptionId": "..." }` to renew before expiration.
5. Confirm `/api/webhooks/graph` receives the Graph validation token and `/api/health` returns `ok: true`.

Production check:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

## TEN-MINUTE QA CHECKLIST

- Sign in, toggle dark/light and comfortable/compact, refresh, and confirm persistence.
- Open the queue on a phone-sized viewport; search/filter and use J/K then A.
- Open FHQ-1048; verify Digest is visually derived, provenance opens, original email remains intact, and attachment is listed.
- Take the ticket, switch Human/Tech voice, add an internal note, send a reply, then resolve and undo.
- Re-route to OLC and confirm the explanation and directory-update prompt.
- Drag a board card between school columns; confirm code plus color and undo toast.
- Upload `public/sample-staff.csv`; inspect mapping, row validation, and exact diff before confirm.
- Open directory import history and preview rollback; confirm copy states old ticket attribution is unchanged.
- Open Incidents, Run Planner, Reports, Knowledge, a school dashboard, and public `/status` at 390px and 1440px.
- Keyboard-tab through login, queue filters, ticket actions, composer, import mapping, and command palette; confirm every focus ring is visible.
