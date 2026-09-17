-- Scheduled publishing, driven by Postgres rather than the Node process

-- Run this in the Supabase SQL editor after replacing the two placeholders
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('publish-due')
where exists (select 1 from cron.job where jobname = 'publish-due');

select cron.schedule(
  'publish-due',
  '* * * * *',
  $$
    select net.http_post(
      url     := '<BACKEND_URL>/api/cron/publish-due',
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'x-cron-secret',  '<CRON_SECRET>'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $$
);


-- Daily news, which picks the day's topics.
--
-- This runs every hour on purpose, and it does NOT mean the pipeline runs every
-- hour. The hour a tenant actually runs at is a setting in the dashboard
-- (CampaignProfile.newsRunHour, in that tenant's own timezone), so the schedule
-- cannot know it: pg_cron only speaks UTC, the offset moves under daylight
-- saving, and two tenants can want different hours. The backend is asked every
-- hour and answers "nobody" for 23 of them.
--
-- Because it is asked hourly, a tick the backend missed — asleep, deploying,
-- cold-starting — is picked up by the next one rather than losing the day.
-- Running twice is prevented by a unique (userId, localDate) key on NewsRun,
-- not by the schedule.
--
-- If you change the run time in the dashboard, you do not need to touch this.

select cron.unschedule('daily-news')
where exists (select 1 from cron.job where jobname = 'daily-news');

-- Superseded by the hourly job below; dropped if an older setup registered it.
select cron.unschedule('daily-news-dst')
where exists (select 1 from cron.job where jobname = 'daily-news-dst');

select cron.schedule(
  'daily-news',
  '0 * * * *',
  $$
    select net.http_post(
      url     := '<BACKEND_URL>/api/cron/daily-news',
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'x-cron-secret',  '<CRON_SECRET>'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $$
);

---- Verification ----
-- Are the jobs registered and active?
--    select jobid, jobname, schedule, active, command from cron.job;
--
-- What did the backend answer?
--    select * from cron.job_run_details order by start_time desc limit 20;
--
-- Note: net.http_post is fire-and-forget. It returns a request id, not a
-- response, so a successful cron run only means the request went out. What the
-- news pipeline actually did is in the NewsRun table, or on the Daily News
-- screen in the dashboard.