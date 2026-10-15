-- ============================================================
-- Trackit — Roll back migration 003 (calendar subscription feed)
-- Run the API version without the calendar feed first. Safe to re-run.
-- Every subscription link stops working, and creating a new one needs
-- migration 003 again.
-- ============================================================

DROP FUNCTION IF EXISTS public.calendar_feed(TEXT);
DROP TABLE IF EXISTS public.calendar_feeds;
