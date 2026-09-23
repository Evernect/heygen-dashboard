-- Captions are burned into the stored video by the backend, so a script keeps
-- the SRT it was burned from and the words that were emphasised.
ALTER TABLE "Script" ADD COLUMN "heygenSubtitleUrl" TEXT;
ALTER TABLE "Script" ADD COLUMN "captionHighlights" JSONB;
