# AI Video Automation

**Flow:** add a topic (issue + angle) → generate a script and five platform
captions with an LLM → review, edit and approve it with a schedule → a
Supabase `pg_cron` job publishes it automatically at that time (HeyGen renders
the avatar video, then it posts to Facebook and Instagram) → engagement metrics
feed the Insights screen.

| | |
|---|---|
| `frontend/` | Next.js 16, React 19, Tailwind v4, shadcn/ui (Base UI + Nova style) |
| `backend/` | Express 5, Prisma 7, Supabase Postgres + Storage |

---

## 1. Supabase project

Create a project, then from **Project Settings → Database → Connection string**
take both connection strings:

- **Transaction pooler** (port `6543`) → `DATABASE_URL`, used by the running app
- **Direct connection** (port `5432`) → `DIRECT_URL`, used by migrations
  (migrations cannot run through the pooler)

From **Project Settings → API** take the project URL and the **service role**
key. Then create a **public** Storage bucket named `videos` - rendered videos
are re-hosted there because Meta's Graph API fetches the file from a public URL.

## 2. Backend

```bash
cd backend
cp .env.example .env        # then fill it in
npm install
npx prisma migrate dev --name init
npm run db:seed             # optional: a few example topics
npm run dev                 # http://localhost:4000
```

Generate the cron secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Leave `DRY_RUN_HEYGEN` and `DRY_RUN_META` set to `true` while developing - the
pipeline runs end to end but never spends HeyGen credits or posts to real
accounts.

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:3000
```

## 4. Scheduling (`pg_cron`)

Scheduled publishing is driven by Postgres, not by the Node process, so nothing
needs to stay open for a post to go out.

1. Make the backend publicly reachable. `pg_net` cannot reach `localhost`, so
   for local development tunnel it: `ngrok http 4000`.
2. Open `backend/prisma/migrations/manual/pg_cron_setup.sql`, replace
   `<BACKEND_URL>` and `<CRON_SECRET>`, and run it in the Supabase SQL editor.

The job calls `POST /api/cron/publish-due` every minute with an `x-cron-secret`
header. Verification queries (did it fire? what did the backend answer?) are at
the bottom of that SQL file.

---

## How scheduled publishing stays safe to repeat

`net.http_post` is fire-and-forget: Postgres never retries and never waits for
a response. The every-minute cadence *is* the retry mechanism, so the endpoint
is built to be re-entered safely.

Work is claimed with a single `UPDATE … RETURNING` using `FOR UPDATE SKIP
LOCKED`, so two overlapping ticks can never claim the same script. From there,
which phase a script resumes at is inferred from the fields already stored:

| State | Next action |
|---|---|
| `heygenVideoId` is null | submit the render, save the id, stop |
| `videoStorageUrl` is null | poll HeyGen; when done, download and upload, then publish |
| `videoStorageUrl` is set | publish to each platform without a successful post |

So a video is rendered **once**, uploaded **once**, and each platform is posted
to **once**, however many times the job runs. The unique
`(scriptId, platform)` constraint on `PlatformPost` is the database-level
backstop.

A `FAILED` script keeps its rendered video, so **Retry** in the UI resumes at
the publish step without re-spending HeyGen credits.

---

## API

Everything is open except `/api/cron/*`, which requires the shared secret.
There is no authentication yet.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/topics` | List content bank topics (`?status=`) |
| `POST` | `/api/topics` | Create a topic |
| `PATCH` | `/api/topics/:id` | Edit a topic |
| `DELETE` | `/api/topics/:id` | Delete a topic (blocked once scripts exist) |
| `POST` | `/api/topics/:id/generate` | Generate a script from the topic |
| `GET` | `/api/scripts` | List scripts (`?status=`) |
| `GET` | `/api/scripts/:id` | One script with its publish results |
| `PATCH` | `/api/scripts/:id` | Edit before approval |
| `POST` | `/api/scripts/:id/approve` | `{ scheduledAt, targetPlatforms }` |
| `POST` | `/api/scripts/:id/reject` | `{ reason }` |
| `POST` | `/api/scripts/:id/retry` | Re-queue a failed script |
| `POST` | `/api/cron/publish-due` | Scheduling webhook (`x-cron-secret`) |
| `GET` | `/api/metrics/summary` | Aggregates for the Insights screen |
| `GET` | `/api/insights` | LLM recommendations |

## Script statuses

`PENDING_REVIEW` → `APPROVED` → `PROCESSING` → `POSTED`, with `FAILED`
(retryable) and `REJECTED` (terminal) as the off-ramps.

## Current limitations

- Only **Facebook** and **Instagram** publish. YouTube, TikTok and X can be
  selected - the captions are generated - but the pipeline records them as
  unimplemented rather than posting. This matches the original n8n workflow.
- Metrics collection and the LLM insight analysis are not wired up yet; the
  Insights screen reads real data and shows an empty state until they are.
- No authentication. `createdBy` / `approvedBy` columns exist but stay null.
