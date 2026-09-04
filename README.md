# AI Video Automation

**Flow:** add a topic (issue + angle) → generate **three** distinct scripts,
each with five platform captions → pick one → HeyGen renders the avatar video →
watch the preview → pick an upload time and approve → a Supabase `pg_cron` job
posts it to Facebook and Instagram at that time → engagement metrics feed the
Insights screen.

Nothing is uploaded without an approval, and no approval is possible before the
finished video has been rendered and previewed.

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

## Rendering happens before approval, publishing after

The two halves of the pipeline are triggered by different things:

- **Rendering** is started by a person, from `POST /api/scripts/:id/render`.
  It picks one of the topic's script options and submits it to HeyGen. The
  dashboard polls `GET /api/scripts/:id/render-status` while it waits, and the
  cron tick advances any in-flight render too, so closing the tab cannot strand
  a finished video.
- **Publishing** is started by the schedule, and only ever for a script that a
  person already approved against a video they could watch.

Only one script per topic can occupy the render-to-posted stretch at a time.
Disapproving frees the topic, and the options nobody picked stay selectable, so
a different one can be rendered instead.

### How scheduled publishing stays safe to repeat

`net.http_post` is fire-and-forget: Postgres never retries and never waits for
a response. The every-minute cadence *is* the retry mechanism, so the endpoint
is built to be re-entered safely.

Work is claimed with a single `UPDATE … RETURNING` using `FOR UPDATE SKIP
LOCKED`, so two overlapping ticks can never claim the same script. Because the
video already exists by the time a script is claimed, the tick only has the
publish step left: each target platform without a successful post is posted to,
and the unique `(scriptId, platform)` constraint on `PlatformPost` is the
database-level backstop against a double post.

A `FAILED` script keeps whatever it got as far as. **Retry** in the UI resumes
at the publish step when the video is already stored, and re-renders only when
the failure happened before the video existed.

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
| `POST` | `/api/topics/:id/generate` | Generate the topic's script options |
| `GET` | `/api/scripts` | List scripts (`?status=`, `?topicId=`) |
| `GET` | `/api/scripts/:id` | One script with its publish results |
| `PATCH` | `/api/scripts/:id` | Edit an option before it is rendered |
| `POST` | `/api/scripts/:id/render` | Pick this option and start the video |
| `GET` | `/api/scripts/:id/render-status` | Advance and report an in-flight render |
| `POST` | `/api/scripts/:id/approve` | `{ scheduledAt, targetPlatforms }` |
| `POST` | `/api/scripts/:id/reject` | `{ reason }` |
| `POST` | `/api/scripts/:id/retry` | Re-queue a failed script |
| `POST` | `/api/cron/publish-due` | Scheduling webhook (`x-cron-secret`) |
| `GET` | `/api/metrics/summary` | Aggregates for the Insights screen |
| `GET` | `/api/insights` | LLM recommendations |

## Script statuses

`DRAFT` → `RENDERING` → `PENDING_REVIEW` → `APPROVED` → `PROCESSING` →
`POSTED`, with `FAILED` (retryable) and `REJECTED` as the off-ramps.

| Status | Meaning |
|---|---|
| `DRAFT` | One of the generated options, waiting to be picked |
| `RENDERING` | Picked; HeyGen is building the video |
| `PENDING_REVIEW` | Video is ready to watch and approve |
| `APPROVED` | Upload time set; waiting for the cron to publish |

`REJECTED` is not terminal for the topic: its unpicked `DRAFT` siblings stay
selectable, so another one can be rendered in its place.

## Current limitations

- Only **Facebook** and **Instagram** publish. YouTube, TikTok and X can be
  selected - the captions are generated - but the pipeline records them as
  unimplemented rather than posting. This matches the original n8n workflow.
- Metrics collection and the LLM insight analysis are not wired up yet; the
  Insights screen reads real data and shows an empty state until they are.
- No authentication. `createdBy` / `approvedBy` columns exist but stay null.
