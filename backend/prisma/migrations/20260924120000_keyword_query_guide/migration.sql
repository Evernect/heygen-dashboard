-- Keywords follow the query guide: priority is 1-5 (default 4), type is one of
-- issue/name/geo/feed and scope one of district/state/national.

ALTER TABLE "NewsKeyword" ALTER COLUMN "priority" SET DEFAULT 4;

UPDATE "NewsKeyword" SET "priority" = 5 WHERE "priority" > 5;

UPDATE "NewsKeyword" SET "type" = lower(trim("type"));
UPDATE "NewsKeyword"
SET "type" = CASE
  WHEN "query" ~* '^RSS:' THEN 'feed'
  WHEN "query" ~* '^GEO:' THEN 'geo'
  ELSE 'issue'
END
WHERE "type" NOT IN ('issue', 'name', 'geo', 'feed');

UPDATE "NewsKeyword" SET "scope" = lower(trim("scope"));
UPDATE "NewsKeyword" SET "scope" = 'state'
WHERE "scope" NOT IN ('district', 'state', 'national');
