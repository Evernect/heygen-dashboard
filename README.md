# AI Video Automation

**Flow:** add a topic by hand, or let the 7am news run pick three → generate
**three** distinct scripts,
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
npx prisma migrate deploy
npm run db:seed -- <user-id>    # optional: example topics for one user
npm run news:seed -- <user-id>  # optional: example news feeds and positions
npm test                        # clustering, scoring and filtering
npm run dev                     # http://localhost:4000
```

Generate the cron secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`CREDENTIAL_ENCRYPTION_KEY` encrypts each user's stored HeyGen key at rest.
Generate it the same way as the cron secret. Without it the connect screen
refuses to save anything.

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
2. Open `backend/prisma/sql/pg_cron_setup.sql`, replace `<BACKEND_URL>` and
   `<CRON_SECRET>`, and run it in the Supabase SQL editor.

   It lives outside `prisma/migrations/` on purpose: Prisma treats every
   directory in there as a migration it should apply, and this file is meant to
   be run by hand against Supabase instead.

That file registers two jobs: `publish-due` every minute, and `daily-news` every
hour. Both carry an `x-cron-secret` header. Verification queries (did it fire?
what did the backend answer?) are at the bottom of the SQL file.

### Why the news job runs hourly

It runs hourly; the pipeline does not. **The run time is a dashboard setting**
(`newsRunHour`, in the tenant's own timezone), so the schedule cannot know it —
`pg_cron` speaks only UTC, the offset moves twice a year under daylight saving,
and two tenants can want different hours. Postgres therefore asks every hour and
the backend answers "nobody due" for twenty-three of them, which costs
twenty-three no-op HTTP requests a day.

The payoff is that **changing the run time in the dashboard needs no SQL**. A
fixed schedule would have to be re-registered by hand every time, and silently
stop firing if anyone forgot.

Being asked hourly also makes the job self-healing: the backend runs a tenant
whose hour has *passed* and who has no run recorded for the day yet, so a tick
that arrived while the server was asleep, deploying or cold-starting is picked
up by the next one instead of losing the day. A run that started and **failed**
is not retried automatically — it already spent whatever it spent, and repeating
that hourly would multiply the cost of a persistent failure. **Run now** is the
retry.

Running twice is prevented by the unique `(userId, localDate)` key on `NewsRun`,
never by the schedule.

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

## Daily news

Every morning the pipeline reads the feeds configured on **Daily News → News
sources**, works out which stories are real and which matter to this campaign,
and writes up to three topics with an angle already drafted in the candidate's
voice. Each one has a **Generate** button that behaves exactly like the content
bank's.

The stages, in order: build one feed URL per active keyword → fetch them one at
a time → drop anything older than 36 hours → **enforce relevance in code** →
cluster near-identical headlines → score them → log every cluster → read the
best article of each → ask the model to pick → ask it to write the angles →
save.

That relevance check is not redundant with the query. Google News ignores
grouped boolean operators, so `(gas tax OR "fuel tax") California` constrains
almost nothing; the `terms` and `places` columns are what actually decide, and
they are applied in `article-filter.js` after the fetch. An article has to
mention one term **and** one place to survive.

### Why news topics are still Topic rows

A daily news item is its own row in its own table, but pressing Generate
materialises a `Topic` carrying `source: DAILY_NEWS` and then runs the same
generation code the content bank does. The content bank lists `source: MANUAL`
only, so news topics never appear there.

The alternative — letting `Script.topicId` be null and giving a script a second
kind of parent — breaks two queries *silently*. `busySibling` in
`video-render.service.js` has no `userId` filter and is safe only because
`topicId` is a non-null foreign key to a user-owned row: the key **is** the
tenancy boundary there. With nulls it would match other tenants' scripts. The
sibling lookups in `scripts.controller.js` and `groupScriptsByTopic` would
likewise collapse every null into one bucket. Keeping one required parent costs
one enum column and leaves all sixteen call sites that read `script.topic`
untouched.

One consequence worth knowing: Insights counts news-derived topics alongside
manual ones in "top topics". That is deliberate — anything that became a video
belongs there.

### Degrading rather than failing

Almost nothing in a morning run is worth failing the whole run over.

| Situation | What happens |
|---|---|
| A feed rate-limits or times out | One retry honouring `Retry-After`, then that feed is skipped. The run is `PARTIAL` |
| `JINA_API_KEY` is not set | Every summary is written from headlines, flagged in the UI, run succeeds |
| Nothing clears the filters | `SUCCEEDED` with zero topics. The model is **never** called with an empty candidate list — handed nothing, it invents a story, which is the worst thing this pipeline can produce |
| The model names a story that does not exist | The topic is kept and flagged "source unresolved" rather than dropped |
| The angle call fails | Topics are saved with an empty angle for someone to write. The picks depend on a news window that has closed; an angle is a sentence a person can type |
| The selection call fails | The run fails — there is nothing to build without picks |

### Importing the sheets

Both **Feeds** and **Stated positions** on the setup screen take a CSV or Excel
upload, and both read the original Google Sheets tabs as they are — the
`keyword_id` / `topic_label` / `position_summary` column names are understood
directly, along with pipe-separated `terms` and `places`, `Y`/`N` for `active`,
and Excel's serial date format for `last_verified`.

Re-importing an edited sheet **updates** rather than duplicates: feeds are
matched on their code and positions on their issue. The preview says which rows
are new and which will overwrite something before anything is written.

### Running it by hand

**Run now** on the Daily News screen runs the whole pipeline immediately. It is
the way to test a keyword change without waiting until morning.

To see what the feeds and the scoring are doing before spending anything on the
model:

```bash
cd backend
npm run news:preview -- <user-id>   # stages 1-6 only, no LLM call
```

### One run per tenant per day

The guard is a unique `(userId, localDate)` on `NewsRun`, claimed before a
single feed is fetched — not the in-process flag beside it, which does nothing
across a restart or a second instance. A duplicate tick collides there and is
recorded as `SKIPPED`. `localDate` is the date in the tenant's **own** zone;
`toISOString().slice(0, 10)` would be a different day from 4pm Pacific onwards
and would defeat the key for part of every year.

Forcing a re-run reopens that day's record and clears what the previous attempt
logged, so the week's repeat check is not poisoned by the pipeline's own output.

## Connecting HeyGen

Rendering runs on the signed-in user's own HeyGen account, not a shared
deployment-wide key. A user who has not connected one is redirected out of the
dashboard to `/connect-heygen` and cannot get past it, because nothing in the
pipeline works without it.

The dashboard's **Integrations** tab is where an account is connected, updated
or disconnected. Settings keeps only the render configuration — which avatar,
look and engine — so the account and the way it is used stay separate.

The key is verified before it is stored: `PUT /api/heygen/connection` calls
`GET /v3/users/me` with it, and a key HeyGen refuses comes back as a 401 the
form shows against the field rather than being saved and failing later at
render time. What is stored is AES-256-GCM ciphertext plus a masked hint
(`sk_…VZAX`); the key itself is never sent back to the browser. Signing out and
back in shows the connected account again, and the same panel on **Settings**
replaces the key or disconnects entirely.

`HEYGEN_API_KEY` in `.env` is now only a fallback for work that has no user
attached — the `pg_cron` tick advancing an in-flight render. Requests made by
the dashboard always carry a session, so they always use that user's key.

## Tenancy

Every row belongs to a Supabase user. `Topic`, `Script` and `Insight` carry a
`userId`, as do `AppSettings`, `HeygenConnection` and every table behind the
daily news pipeline — `NewsKeyword`, `CampaignProfile`, `CandidatePosition`,
`StylePlaybook`, `NewsClusterHistory`, `NewsRun` and `DailyNewsItem`. Every
route outside `/api/cron/*` requires an access token and filters by the caller.

Lookups by id use `findFirst` with the owner folded into the query rather than
`findUnique`, so another tenant's id comes back **404 rather than 403** — the
response does not reveal that the row exists at all.

`Script.userId` is denormalised from its topic instead of being joined through
it, and that is what lets background work stay tenant-correct: the `pg_cron`
tick claims due scripts across every tenant, then renders and polls each one
with **its owner's** HeyGen key and settings. `startRender` and `advanceRender`
take no user argument for exactly this reason — they read the owner off the
script, so a render behaves the same whether a person or the scheduler
advanced it.

`AppSettings` has one row per user rather than a shared `singleton`. A user who
has never opened the Settings page has no row and runs on the environment
defaults; the row is written the first time they save. Script generation then
uses that user's OpenAI model and word range, and a render uses their avatar,
look and engine.

`approvedBy` records which user approved a script. Seeding needs an owner, so
`npm run db:seed -- <user-id>` takes one (`select id, email from auth.users`).

## Picking an avatar

HeyGen models avatars in two levels: a **group** is a character, and each group
holds one or more **looks** (outfit, pose, framing). The look id is what
`POST /v3/videos` takes as `avatar_id`, so Settings picks a group first and
then a look within it, and stores both — the group id only so the saved look
can be found again on the next page load without scanning every group.

Each look carries its own `preview_image_url`, so the preview beside the
dropdowns updates with no extra request, and shows the saved avatar when the
page is reopened. Those URLs are signed and expire, which is why the preview is
a plain `<img>` rather than `next/image`: the optimiser would cache a copy that
outlives the signature.

Both endpoints page at 50 items; the UI says so when there is more than one
page rather than pretending the list is complete.

## API

Every route requires a Supabase access token (`Authorization: Bearer …`, sent
automatically by the dashboard's API client) and returns only that user's rows.
The exception is `/api/cron/*`, which has no user and authenticates with the
shared secret instead.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/integrations` | HeyGen connection plus Meta's env-derived status |
| `GET` | `/api/heygen/connection` | The caller's HeyGen connection, or null |
| `PUT` | `/api/heygen/connection` | Verify an API key against HeyGen and store it |
| `DELETE` | `/api/heygen/connection` | Forget the stored key |
| `GET` | `/api/news/keywords` | The caller's feed keywords |
| `POST` | `/api/news/keywords` | Add a feed |
| `POST` | `/api/news/keywords/bulk` | Import feeds, upserting on the keyword code |
| `PATCH` | `/api/news/keywords/:id` | Edit a feed |
| `DELETE` | `/api/news/keywords/:id` | Remove a feed |
| `GET` | `/api/news/campaign-profile` | Who the pipeline writes for |
| `PUT` | `/api/news/campaign-profile` | Save it |
| `GET` | `/api/news/positions` | The candidate's stated positions |
| `POST` | `/api/news/positions` | Add a position |
| `POST` | `/api/news/positions/bulk` | Import positions, matching on the issue |
| `PATCH` | `/api/news/positions/:id` | Edit a position |
| `DELETE` | `/api/news/positions/:id` | Remove a position |
| `GET` | `/api/news/style-playbook` | Voice guidance, newest first |
| `POST` | `/api/news/style-playbook` | Add a version, superseding the last |
| `DELETE` | `/api/news/style-playbook/:id` | Remove a version |
| `GET` | `/api/daily-news` | List daily news topics (`?status=`, `?page=`) |
| `PATCH` | `/api/daily-news/:id` | Edit the topic or angle before generating |
| `POST` | `/api/daily-news/:id/generate` | Generate this topic's script options |
| `POST` | `/api/daily-news/:id/dismiss` | Pass on a topic |
| `DELETE` | `/api/daily-news/:id` | Delete a topic (blocked once scripts exist) |
| `POST` | `/api/daily-news/run` | Run the pipeline now |
| `GET` | `/api/daily-news/runs` | Recent runs |
| `GET` | `/api/daily-news/runs/latest` | The run shown in the status strip |
| `POST` | `/api/cron/daily-news` | Daily news webhook (`x-cron-secret`) |
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
| `GET` | `/api/settings/heygen/avatar-groups` | The caller's HeyGen avatars (characters) |
| `GET` | `/api/settings/heygen/avatar-looks` | Looks, filterable by `?groupId=` |
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
- Meta credentials are still deployment-wide: `FACEBOOK_PAGE_ID`,
  `INSTAGRAM_BUSINESS_ACCOUNT_ID` and `META_PAGE_ACCESS_TOKEN` come from the
  environment, so every tenant publishes to the same pages. Integrations shows
  whether they are configured but cannot change them; connecting Facebook and
  Instagram per account is still to come.
- The OpenAI API key is deployment-wide too. Only the model, temperature,
  reasoning effort and word range are per-user. The same applies to
  `JINA_API_KEY`, which the daily news run uses to read article text — it is
  optional, and without it every summary is drawn from headlines alone.
- The daily news run holds a Node event loop for minutes at a time, most of it
  the deliberate spacing between feed requests. That is fine in the
  long-running process it shares with the publishing tick, but it is the one
  part of the pipeline that would have to become a queue if the backend ever
  moved to a serverless runtime.
