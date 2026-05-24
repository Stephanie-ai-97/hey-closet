-- ============================================================
-- ROLLBACK MIGRATION: Remove Tagging System
-- Version: 1.0.0 Rollback
-- Date: 2024-05-23
-- WARNING: This removes tagging tables and tag data. Base item,
-- colour, style, material, and info data remain intact.
-- ============================================================

-- ============================================================
-- 1. DROP VIEW
-- ============================================================
DROP VIEW IF EXISTS public.item_with_tags;

-- ============================================================
-- 2. DROP TABLES OWNED BY THE TAGGING MIGRATION
-- ============================================================
DROP TABLE IF EXISTS public.customtag;
DROP TABLE IF EXISTS public.itemtag;
DROP TABLE IF EXISTS public.occasion;
DROP TABLE IF EXISTS public.season;

-- ============================================================
-- 3. REMOVE MIGRATION RECORDS AND EMPTY TRACKING TABLE
-- ============================================================
DO $$
BEGIN
    IF to_regclass('public.schema_migrations') IS NOT NULL THEN
        DELETE FROM public.schema_migrations
        WHERE version IN (
            'tagging-system-v1.0',
            'data-migration-populate-tags-v1.1'
        );

        IF NOT EXISTS (SELECT 1 FROM public.schema_migrations) THEN
            DROP TABLE public.schema_migrations;
        END IF;
    END IF;
END $$;

-- ============================================================
-- END OF ROLLBACK
-- ============================================================
