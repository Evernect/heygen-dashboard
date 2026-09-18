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
-- If you change the run time in the dashboard, you do not need to touch this.
select cron.unschedule('daily-news')
where exists (select 1 from cron.job where jobname = 'daily-news');

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


-- Performance feedback loop: reads engagement off Facebook and Instagram every day, and reviews what is working once a week.
-- Both run hours are dashboard settings, so this schedule never needs changing.
select cron.unschedule('insights-due')
where exists (select 1 from cron.job where jobname = 'insights-due');

select cron.schedule(
  'insights-due',
  '0 * * * *',
  $$
    select net.http_post(
      url     := '<BACKEND_URL>/api/cron/insights-due',
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

-- What did the backend answer?
--    select * from cron.job_run_details order by start_time desc limit 20;