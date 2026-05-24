-- ============================================================
-- MIGRATION: Add Tagging System to HeyCloset Database
-- Version: 1.0.0
-- Date: 2024-05-23
-- Purpose: Extend clothing item schema to support scalable tagging
-- ============================================================

-- ============================================================
-- 1. ALTER EXISTING ITEM TABLE
-- ============================================================
-- Add new columns for extended tagging support
ALTER TABLE item ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE item ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
ALTER TABLE item ADD COLUMN IF NOT EXISTS primary_color VARCHAR(100);
ALTER TABLE item ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(100);
ALTER TABLE item ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE item ADD COLUMN IF NOT EXISTS warmth_level VARCHAR(50);
ALTER TABLE item ADD COLUMN IF NOT EXISTS fit VARCHAR(50);

-- Add indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_item_category ON item(category);
CREATE INDEX IF NOT EXISTS idx_item_subcategory ON item(subcategory);
CREATE INDEX IF NOT EXISTS idx_item_primary_color ON item(primary_color);
CREATE INDEX IF NOT EXISTS idx_item_secondary_color ON item(secondary_color);
CREATE INDEX IF NOT EXISTS idx_item_brand ON item(brand);
CREATE INDEX IF NOT EXISTS idx_item_warmth_level ON item(warmth_level);
CREATE INDEX IF NOT EXISTS idx_item_fit ON item(fit);

-- ============================================================
-- 2. CREATE NEW SEASON TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS season (
    pk_seasonid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    season_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default seasons
INSERT INTO season (season_name) VALUES 
('spring'),
('summer'),
('fall'),
('winter'),
('all-season')
ON CONFLICT (season_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_season_name ON season(season_name);

-- ============================================================
-- 3. CREATE NEW OCCASION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS occasion (
    pk_occasionid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occasion_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default occasions
INSERT INTO occasion (occasion_name) VALUES 
('everyday'),
('work'),
('business-meeting'),
('casual-date'),
('formal-date'),
('party'),
('wedding'),
('gym'),
('outdoor-activity'),
('beach'),
('sleep'),
('lounge'),
('travel'),
('interview')
ON CONFLICT (occasion_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_occasion_name ON occasion(occasion_name);

-- ============================================================
-- 4. UPDATE STYLE TABLE
-- ============================================================
-- Note: The existing style table is being retained but we're adding
-- a style_name column to support the new tagging system
ALTER TABLE style ADD COLUMN IF NOT EXISTS style_name VARCHAR(100);

-- Copy existing styletype values to style_name if they don't exist
UPDATE style SET style_name = styletype WHERE style_name IS NULL;

-- Insert additional style records for common styles if not exists
INSERT INTO style (style_name, styletype) VALUES 
('casual', 'casual'),
('formal', 'formal'),
('business', 'business'),
('sporty', 'sporty'),
('bohemian', 'bohemian'),
('minimalist', 'minimalist'),
('vintage', 'vintage'),
('trendy', 'trendy'),
('preppy', 'preppy'),
('edgy', 'edgy'),
('romantic', 'romantic'),
('athletic', 'athletic'),
('classic', 'classic')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_style_name ON style(style_name);

-- ============================================================
-- 5. CREATE ITEMTAG JUNCTION TABLE
-- ============================================================
-- Links items to their season, style, and occasion tags
CREATE TABLE IF NOT EXISTS itemtag (
    pk_itemtagid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dk_itemid INT NOT NULL,
    dk_seasonid INT,
    dk_styleid INT,
    dk_occasionid INT,
    tag_source VARCHAR(20) CHECK (tag_source IN ('system', 'user', 'ai')) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dk_itemid) REFERENCES item(pk_itemid) ON DELETE CASCADE,
    FOREIGN KEY (dk_seasonid) REFERENCES season(pk_seasonid) ON DELETE CASCADE,
    FOREIGN KEY (dk_styleid) REFERENCES style(pk_styleid) ON DELETE CASCADE,
    FOREIGN KEY (dk_occasionid) REFERENCES occasion(pk_occasionid) ON DELETE CASCADE,
    UNIQUE(dk_itemid, dk_seasonid, dk_styleid, dk_occasionid)
);

CREATE INDEX IF NOT EXISTS idx_itemtag_item ON itemtag(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_itemtag_season ON itemtag(dk_seasonid);
CREATE INDEX IF NOT EXISTS idx_itemtag_style ON itemtag(dk_styleid);
CREATE INDEX IF NOT EXISTS idx_itemtag_occasion ON itemtag(dk_occasionid);

-- ============================================================
-- 6. CREATE CUSTOMTAG TABLE
-- ============================================================
-- Stores user-defined and AI-generated custom tags for items
CREATE TABLE IF NOT EXISTS customtag (
    pk_customtagid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dk_itemid INT NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    tag_category VARCHAR(50) CHECK (tag_category IN ('user_defined', 'ai_generated')) DEFAULT 'user_defined',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dk_itemid) REFERENCES item(pk_itemid) ON DELETE CASCADE,
    UNIQUE(dk_itemid, tag_name, tag_category)
);

CREATE INDEX IF NOT EXISTS idx_customtag_item ON customtag(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_customtag_name ON customtag(tag_name);
CREATE INDEX IF NOT EXISTS idx_customtag_category ON customtag(tag_category);

-- ============================================================
-- 7. CREATE COMPREHENSIVE FILTER VIEW
-- ============================================================
-- This view makes it easier to query items with all their tags
CREATE OR REPLACE VIEW item_with_tags AS
SELECT 
    i.pk_itemid as item_id,
    i.dk_closet,
    i.itemtype,
    i.itemsize,
    i.category,
    i.subcategory,
    i.primary_color,
    i.secondary_color,
    i.brand,
    i.warmth_level,
    i.fit,
    i.itemlikerating,
    i.itemcost,
    i.itemcomment,
    i.itemwashmethod,
    i.isoncamera,
    i.wash_status,
    i.in_temp,
    i.created_at,
    i.updated_at,
    json_agg(DISTINCT s.season_name) FILTER (WHERE s.season_name IS NOT NULL) as seasons,
    json_agg(DISTINCT st.style_name) FILTER (WHERE st.style_name IS NOT NULL) as styles,
    json_agg(DISTINCT o.occasion_name) FILTER (WHERE o.occasion_name IS NOT NULL) as occasions,
    json_agg(DISTINCT ct.tag_name) FILTER (WHERE ct.tag_name IS NOT NULL) as custom_tags
FROM item i
LEFT JOIN itemtag it ON i.pk_itemid = it.dk_itemid
LEFT JOIN season s ON it.dk_seasonid = s.pk_seasonid
LEFT JOIN style st ON it.dk_styleid = st.pk_styleid
LEFT JOIN occasion o ON it.dk_occasionid = o.pk_occasionid
LEFT JOIN customtag ct ON i.pk_itemid = ct.dk_itemid
GROUP BY i.pk_itemid;

-- ============================================================
-- 8. CREATE MIGRATION TRACKING TABLE
-- ============================================================
-- Optional: Track which migrations have been applied
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (version) VALUES ('tagging-system-v1.0') 
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================
-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_item_category_subcategory ON item(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_item_color_warmth ON item(primary_color, warmth_level);
CREATE INDEX IF NOT EXISTS idx_itemtag_source_created ON itemtag(tag_source, created_at);

-- ============================================================
-- END OF MIGRATION
-- ============================================================
-- Summary of changes:
-- 1. Extended item table with 7 new columns (category, subcategory, colors, brand, warmth, fit)
-- 2. Created season table with default seasons
-- 3. Created occasion table with default occasions
-- 4. Updated style table to support new tagging system
-- 5. Created itemtag junction table for season/style/occasion associations
-- 6. Created customtag table for user-defined and AI-generated tags
-- 7. Created item_with_tags view for easy filtering and querying
-- 8. Added comprehensive indexes for query performance
-- 9. Created schema_migrations table for tracking
-- ============================================================
