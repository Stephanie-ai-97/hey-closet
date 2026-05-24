-- ============================================================
-- ROLLBACK MIGRATION: Remove Tagging System
-- Version: 1.0.0 Rollback
-- Date: 2024-05-23
-- WARNING: This will remove all tagging data. Use with caution!
-- ============================================================

-- ============================================================
-- 1. DROP VIEWS
-- ============================================================
DROP VIEW IF EXISTS item_with_tags;

-- ============================================================
-- 2. DROP TABLES
-- ============================================================
DROP TABLE IF EXISTS customtag;
DROP TABLE IF EXISTS itemtag;
DROP TABLE IF EXISTS occasion;
DROP TABLE IF EXISTS season;

-- ============================================================
-- 3. REMOVE COLUMNS FROM ITEM TABLE
-- ============================================================
ALTER TABLE item DROP COLUMN IF EXISTS category;
ALTER TABLE item DROP COLUMN IF EXISTS subcategory;
ALTER TABLE item DROP COLUMN IF EXISTS primary_color;
ALTER TABLE item DROP COLUMN IF EXISTS secondary_color;
ALTER TABLE item DROP COLUMN IF EXISTS brand;
ALTER TABLE item DROP COLUMN IF EXISTS warmth_level;
ALTER TABLE item DROP COLUMN IF EXISTS fit;

-- ============================================================
-- 4. REMOVE COLUMN FROM STYLE TABLE
-- ============================================================
ALTER TABLE style DROP COLUMN IF EXISTS style_name;

-- ============================================================
-- 5. REMOVE MIGRATION RECORDS
-- ============================================================
DELETE FROM schema_migrations 
WHERE version IN (
    'tagging-system-v1.0',
    'data-migration-populate-tags-v1.1'
);

-- ============================================================
-- 6. DROP FUNCTION IF EXISTS
-- ============================================================
DROP FUNCTION IF EXISTS get_item_category(VARCHAR);

-- ============================================================
-- END OF ROLLBACK
-- ============================================================
-- All tagging system components have been removed.
-- Your item data remains intact but without the new fields.
-- ============================================================
