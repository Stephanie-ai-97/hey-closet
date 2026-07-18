-- FINAL_SCHEMA.sql: unified HeyCloset schema and seed data
SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.home (
  pk_homelocation INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  homename VARCHAR(100),
  homeaddress VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.storage (
  pk_closet INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_homelocation INTEGER NOT NULL,
  closet VARCHAR(100) NOT NULL,
  closetpartition VARCHAR(100),
  hasstoragecover BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_storage_home FOREIGN KEY (dk_homelocation) REFERENCES public.home(pk_homelocation)
);

CREATE TABLE IF NOT EXISTS public.item (
  pk_itemid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_closet INTEGER NOT NULL,
  itemtype VARCHAR(100) NOT NULL,
  itemsize VARCHAR(50),
  isoncamera BOOLEAN,
  itemlikerating SMALLINT,
  itemcost NUMERIC(10, 2),
  itemcomment VARCHAR(500),
  itemwashmethod VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_item_storage FOREIGN KEY (dk_closet) REFERENCES public.storage(pk_closet),
  CONSTRAINT item_itemcost_check CHECK (itemcost IS NULL OR itemcost >= 0),
  CONSTRAINT item_itemlikerating_check CHECK (itemlikerating IS NULL OR (itemlikerating >= 1 AND itemlikerating <= 10))
);

CREATE TABLE IF NOT EXISTS public.colour (
  pk_colourid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  colouroverall VARCHAR(100),
  majorcolour VARCHAR(100),
  minorcolour VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.material (
  pk_material INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  texture VARCHAR(100),
  softness VARCHAR(100),
  thickness VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.style (
  pk_styleid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  styletype VARCHAR(100),
  styleyear SMALLINT,
  stylefitsize VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.info (
  pk_infoid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_itemid INTEGER NOT NULL,
  dk_styleid INTEGER NOT NULL,
  dk_colourid INTEGER NOT NULL,
  dk_material INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_info UNIQUE (dk_itemid, dk_styleid, dk_colourid, dk_material),
  CONSTRAINT fk_info_item FOREIGN KEY (dk_itemid) REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
  CONSTRAINT fk_info_style FOREIGN KEY (dk_styleid) REFERENCES public.style(pk_styleid),
  CONSTRAINT fk_info_colour FOREIGN KEY (dk_colourid) REFERENCES public.colour(pk_colourid),
  CONSTRAINT fk_info_material FOREIGN KEY (dk_material) REFERENCES public.material(pk_material)
);

CREATE TABLE IF NOT EXISTS public.wash (
  pk_wash INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_itemid INTEGER NOT NULL,
  lastwashdate DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wash_item FOREIGN KEY (dk_itemid) REFERENCES public.item(pk_itemid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.for_location (
  pk_forlocationid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_styleid INTEGER NOT NULL,
  forlocationaddress VARCHAR(200),
  forlocationtype VARCHAR(100),
  isforlocationindoor BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_forlocation_style FOREIGN KEY (dk_styleid) REFERENCES public.style(pk_styleid)
);

CREATE TABLE IF NOT EXISTS public.season (
  pk_seasonid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  season_name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.occasion (
  pk_occasionid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occasion_name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.itemtag (
  pk_itemtagid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_itemid INTEGER NOT NULL,
  dk_seasonid INTEGER,
  dk_styleid INTEGER,
  dk_occasionid INTEGER,
  tag_source VARCHAR(20) DEFAULT 'user' CHECK (tag_source IN ('system', 'user', 'ai')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_itemtag_item FOREIGN KEY (dk_itemid) REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
  CONSTRAINT fk_itemtag_season FOREIGN KEY (dk_seasonid) REFERENCES public.season(pk_seasonid) ON DELETE CASCADE,
  CONSTRAINT fk_itemtag_style FOREIGN KEY (dk_styleid) REFERENCES public.style(pk_styleid) ON DELETE CASCADE,
  CONSTRAINT fk_itemtag_occasion FOREIGN KEY (dk_occasionid) REFERENCES public.occasion(pk_occasionid) ON DELETE CASCADE,
  CONSTRAINT chk_itemtag_has_tag CHECK (dk_seasonid IS NOT NULL OR dk_styleid IS NOT NULL OR dk_occasionid IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.customtag (
  pk_customtagid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_itemid INTEGER NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  tag_category VARCHAR(50) DEFAULT 'user_defined' CHECK (tag_category IN ('user_defined', 'ai_generated')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customtag_item FOREIGN KEY (dk_itemid) REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
  CONSTRAINT uq_customtag UNIQUE (dk_itemid, tag_name, tag_category)
);

CREATE TABLE IF NOT EXISTS public.itemphoto (
  pk_itemphotoid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_itemid INTEGER NOT NULL REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  processed_storage_path TEXT,
  ai_confidence_score NUMERIC(4, 3),
  ai_tags JSONB DEFAULT '[]'::jsonb,
  ai_metadata JSONB,
  ai_status VARCHAR(20) DEFAULT 'skipped',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT itemphoto_ai_confidence_score_check CHECK (ai_confidence_score IS NULL OR (ai_confidence_score >= 0 AND ai_confidence_score <= 1)),
  CONSTRAINT itemphoto_ai_status_check CHECK (ai_status IN ('pending', 'completed', 'failed', 'skipped'))
);

CREATE TABLE IF NOT EXISTS public.outfit (
  pk_outfitid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  outfitname VARCHAR(150) NOT NULL,
  occasion VARCHAR(100),
  season VARCHAR(100),
  notes VARCHAR(500),
  styles TEXT[] NOT NULL DEFAULT '{}',
  seasons TEXT[] NOT NULL DEFAULT '{}',
  occasions TEXT[] NOT NULL DEFAULT '{}',
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.outfititem (
  pk_outfititemid INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dk_outfitid INTEGER NOT NULL REFERENCES public.outfit(pk_outfitid) ON DELETE CASCADE,
  dk_itemid INTEGER NOT NULL REFERENCES public.item(pk_itemid) ON DELETE CASCADE,
  slot VARCHAR(24),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT outfititem_slot_check CHECK (slot IS NULL OR slot IN ('top', 'bottom', 'shoes', 'outerwear', 'accessories'))
);

CREATE INDEX IF NOT EXISTS idx_item_closet ON public.item(dk_closet);
CREATE INDEX IF NOT EXISTS idx_info_item ON public.info(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_info_style ON public.info(dk_styleid);
CREATE INDEX IF NOT EXISTS idx_info_colour ON public.info(dk_colourid);
CREATE INDEX IF NOT EXISTS idx_info_material ON public.info(dk_material);
CREATE INDEX IF NOT EXISTS idx_wash_item ON public.wash(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_forlocation_style ON public.for_location(dk_styleid);
CREATE INDEX IF NOT EXISTS idx_season_name ON public.season(season_name);
CREATE INDEX IF NOT EXISTS idx_occasion_name ON public.occasion(occasion_name);
CREATE INDEX IF NOT EXISTS idx_itemtag_item ON public.itemtag(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_itemtag_season ON public.itemtag(dk_seasonid);
CREATE INDEX IF NOT EXISTS idx_itemtag_style ON public.itemtag(dk_styleid);
CREATE INDEX IF NOT EXISTS idx_itemtag_occasion ON public.itemtag(dk_occasionid);
CREATE INDEX IF NOT EXISTS idx_itemtag_source_created ON public.itemtag(tag_source, created_at);
CREATE INDEX IF NOT EXISTS idx_customtag_item ON public.customtag(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_customtag_name ON public.customtag(tag_name);
CREATE INDEX IF NOT EXISTS idx_customtag_category ON public.customtag(tag_category);
CREATE INDEX IF NOT EXISTS idx_itemphoto_ai_status ON public.itemphoto(ai_status);
CREATE INDEX IF NOT EXISTS idx_itemphoto_ai_tags ON public.itemphoto USING gin(ai_tags);
CREATE INDEX IF NOT EXISTS idx_itemphoto_dk_itemid ON public.itemphoto(dk_itemid);
CREATE INDEX IF NOT EXISTS idx_outfit_favorite ON public.outfit(favorite);
CREATE INDEX IF NOT EXISTS idx_outfit_created_at ON public.outfit(created_at);
CREATE INDEX IF NOT EXISTS idx_outfititem_outfit ON public.outfititem(dk_outfitid);
CREATE INDEX IF NOT EXISTS idx_outfititem_slot ON public.outfititem(slot);

DROP TRIGGER IF EXISTS trg_home_updated ON public.home;
CREATE TRIGGER trg_home_updated BEFORE UPDATE ON public.home FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_storage_updated ON public.storage;
CREATE TRIGGER trg_storage_updated BEFORE UPDATE ON public.storage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_item_updated ON public.item;
CREATE TRIGGER trg_item_updated BEFORE UPDATE ON public.item FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_colour_updated ON public.colour;
CREATE TRIGGER trg_colour_updated BEFORE UPDATE ON public.colour FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_material_updated ON public.material;
CREATE TRIGGER trg_material_updated BEFORE UPDATE ON public.material FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_style_updated ON public.style;
CREATE TRIGGER trg_style_updated BEFORE UPDATE ON public.style FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_info_updated ON public.info;
CREATE TRIGGER trg_info_updated BEFORE UPDATE ON public.info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_wash_updated ON public.wash;
CREATE TRIGGER trg_wash_updated BEFORE UPDATE ON public.wash FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_forlocation_updated ON public.for_location;
CREATE TRIGGER trg_forlocation_updated BEFORE UPDATE ON public.for_location FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_season_updated ON public.season;
CREATE TRIGGER trg_season_updated BEFORE UPDATE ON public.season FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_occasion_updated ON public.occasion;
CREATE TRIGGER trg_occasion_updated BEFORE UPDATE ON public.occasion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_itemtag_updated ON public.itemtag;
CREATE TRIGGER trg_itemtag_updated BEFORE UPDATE ON public.itemtag FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_customtag_updated ON public.customtag;
CREATE TRIGGER trg_customtag_updated BEFORE UPDATE ON public.customtag FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_itemphoto_updated ON public.itemphoto;
CREATE TRIGGER trg_itemphoto_updated BEFORE UPDATE ON public.itemphoto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_outfit_updated ON public.outfit;
CREATE TRIGGER trg_outfit_updated BEFORE UPDATE ON public.outfit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_outfititem_updated ON public.outfititem;
CREATE TRIGGER trg_outfititem_updated BEFORE UPDATE ON public.outfititem FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.item_with_tags AS
SELECT
  i.pk_itemid AS item_id,
  i.dk_closet,
  i.itemtype,
  i.itemsize,
  LOWER(i.itemtype)::VARCHAR(100) AS subcategory,
  (CASE LOWER(i.itemtype)
    WHEN 'shirt' THEN 'tops'
    WHEN 'blouse' THEN 'tops'
    WHEN 't-shirt' THEN 'tops'
    WHEN 'tshirt' THEN 'tops'
    WHEN 'sweater' THEN 'tops'
    WHEN 'cardigan' THEN 'tops'
    WHEN 'hoodie' THEN 'tops'
    WHEN 'crop-top' THEN 'tops'
    WHEN 'tank-top' THEN 'tops'
    WHEN 'polo' THEN 'tops'
    WHEN 'thermal' THEN 'tops'
    WHEN 'jeans' THEN 'bottoms'
    WHEN 'pants' THEN 'bottoms'
    WHEN 'chinos' THEN 'bottoms'
    WHEN 'shorts' THEN 'bottoms'
    WHEN 'skirt' THEN 'bottoms'
    WHEN 'leggings' THEN 'bottoms'
    WHEN 'joggers' THEN 'bottoms'
    WHEN 'cargo' THEN 'bottoms'
    WHEN 'dress' THEN 'dresses'
    WHEN 'casual-dress' THEN 'dresses'
    WHEN 'cocktail-dress' THEN 'dresses'
    WHEN 'evening-dress' THEN 'dresses'
    WHEN 'maxi-dress' THEN 'dresses'
    WHEN 'mini-dress' THEN 'dresses'
    WHEN 'jacket' THEN 'outerwear'
    WHEN 'coat' THEN 'outerwear'
    WHEN 'blazer' THEN 'outerwear'
    WHEN 'puffer' THEN 'outerwear'
    WHEN 'trench' THEN 'outerwear'
    WHEN 'sneakers' THEN 'shoes'
    WHEN 'heels' THEN 'shoes'
    WHEN 'flats' THEN 'shoes'
    WHEN 'boots' THEN 'shoes'
    WHEN 'sandals' THEN 'shoes'
    WHEN 'scarf' THEN 'accessories'
    WHEN 'hat' THEN 'accessories'
    WHEN 'belt' THEN 'accessories'
    WHEN 'bag' THEN 'accessories'
    WHEN 'watch' THEN 'accessories'
    WHEN 'yoga-pants' THEN 'activewear'
    WHEN 'gym-shirt' THEN 'activewear'
    WHEN 'workout-shorts' THEN 'activewear'
    WHEN 'pajamas' THEN 'sleepwear'
    WHEN 'nightgown' THEN 'sleepwear'
    ELSE 'accessories'
  END)::VARCHAR(100) AS category,
  LOWER(COALESCE(metadata.colouroverall, metadata.majorcolour))::VARCHAR(100) AS primary_color,
  LOWER(metadata.minorcolour)::VARCHAR(100) AS secondary_color,
  LOWER(metadata.thickness)::VARCHAR(50) AS warmth_level,
  LOWER(metadata.stylefitsize)::VARCHAR(50) AS fit,
  i.itemlikerating,
  i.itemcost,
  i.itemcomment,
  i.itemwashmethod,
  i.isoncamera,
  i.created_at,
  i.updated_at,
  COALESCE(json_agg(DISTINCT s.season_name) FILTER (WHERE s.season_name IS NOT NULL), '[]'::json) AS seasons,
  COALESCE(json_agg(DISTINCT st.styletype) FILTER (WHERE st.styletype IS NOT NULL), '[]'::json) AS styles,
  COALESCE(json_agg(DISTINCT o.occasion_name) FILTER (WHERE o.occasion_name IS NOT NULL), '[]'::json) AS occasions,
  COALESCE(json_agg(DISTINCT ct.tag_name) FILTER (WHERE ct.tag_name IS NOT NULL), '[]'::json) AS custom_tags
FROM public.item i
LEFT JOIN public.info inf ON inf.dk_itemid = i.pk_itemid
LEFT JOIN public.colour metadata ON metadata.pk_colourid = inf.dk_colourid
LEFT JOIN public.style st ON st.pk_styleid = inf.dk_styleid
LEFT JOIN public.itemtag itemtag_season ON itemtag_season.dk_itemid = i.pk_itemid AND itemtag_season.dk_seasonid IS NOT NULL
LEFT JOIN public.season s ON s.pk_seasonid = itemtag_season.dk_seasonid
LEFT JOIN public.itemtag itemtag_occasion ON itemtag_occasion.dk_itemid = i.pk_itemid AND itemtag_occasion.dk_occasionid IS NOT NULL
LEFT JOIN public.occasion o ON o.pk_occasionid = itemtag_occasion.dk_occasionid
LEFT JOIN public.customtag ct ON ct.dk_itemid = i.pk_itemid
GROUP BY i.pk_itemid, metadata.colouroverall, metadata.majorcolour, metadata.minorcolour, metadata.thickness, metadata.stylefitsize;

INSERT INTO public.season (season_name)
VALUES
  ('spring'),
  ('summer'),
  ('fall'),
  ('winter'),
  ('all-season')
ON CONFLICT (season_name) DO NOTHING;

INSERT INTO public.occasion (occasion_name)
VALUES
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

INSERT INTO public.style (styletype)
SELECT seed.styletype
FROM (VALUES
  ('casual'),
  ('formal'),
  ('business'),
  ('sporty'),
  ('bohemian'),
  ('minimalist'),
  ('vintage'),
  ('trendy'),
  ('preppy'),
  ('edgy'),
  ('romantic'),
  ('athletic'),
  ('classic')
) AS seed(styletype)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.style st
  WHERE st.styletype = seed.styletype
);

INSERT INTO public.itemtag (dk_itemid, dk_seasonid, tag_source)
SELECT i.pk_itemid, s.pk_seasonid, 'system'
FROM public.item i
JOIN public.season s ON s.season_name = 'all-season'
ON CONFLICT DO NOTHING;

INSERT INTO public.itemtag (dk_itemid, dk_styleid, tag_source)
SELECT DISTINCT inf.dk_itemid, inf.dk_styleid, 'system'
FROM public.info inf
JOIN public.style st ON st.pk_styleid = inf.dk_styleid
WHERE st.styletype IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.itemtag (dk_itemid, dk_styleid, tag_source)
SELECT i.pk_itemid, st.pk_styleid, 'system'
FROM public.item i
CROSS JOIN (
  SELECT MIN(pk_styleid) AS pk_styleid
  FROM public.style
  WHERE styletype = 'casual'
) st
WHERE NOT EXISTS (
  SELECT 1
  FROM public.info inf
  WHERE inf.dk_itemid = i.pk_itemid
    AND inf.dk_styleid IS NOT NULL
)
AND st.pk_styleid IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.itemtag (dk_itemid, dk_occasionid, tag_source)
SELECT i.pk_itemid, o.pk_occasionid, 'system'
FROM public.item i
JOIN public.occasion o ON o.occasion_name = 'everyday'
ON CONFLICT DO NOTHING;
