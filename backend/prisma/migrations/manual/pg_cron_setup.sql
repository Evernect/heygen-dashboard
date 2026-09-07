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

---- Verification ----
-- Is the job registered and active? 
--    select jobid, jobname, schedule, active, command from cron.job; (Run in Supabase SQL editor)