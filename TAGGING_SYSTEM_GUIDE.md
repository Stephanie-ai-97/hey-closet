# HeyCloset Tagging System - Implementation Guide

## Overview

This document describes the scalable clothing item tagging system for HeyCloset, including database schema, API endpoints, React components, and usage examples.

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [React Components](#react-components)
4. [Hooks](#hooks)
5. [Constants & Types](#constants--types)
6. [Migration Guide](#migration-guide)
7. [Usage Examples](#usage-examples)
8. [AI Integration](#ai-integration-ready)

---

## Database Schema

### New Tables

#### 1. **season** - Clothing seasons
```sql
CREATE TABLE season (
    pk_seasonid INT PRIMARY KEY,
    season_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default values:** spring, summer, fall, winter, all-season

---

#### 2. **occasion** - Event/activity occasions
```sql
CREATE TABLE occasion (
    pk_occasionid INT PRIMARY KEY,
    occasion_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default values:** everyday, work, business-meeting, casual-date, formal-date, party, wedding, gym, outdoor-activity, beach, sleep, lounge, travel, interview

---

#### 3. **itemtag** - Junction table for item tags
```sql
CREATE TABLE itemtag (
    pk_itemtagid INT PRIMARY KEY,
    dk_itemid INT NOT NULL FK,
    dk_seasonid INT FK,
    dk_styleid INT FK,
    dk_occasionid INT FK,
    tag_source VARCHAR(20) ('system', 'user', 'ai'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Unique Constraint:** (dk_itemid, dk_seasonid, dk_styleid, dk_occasionid)

---

#### 4. **customtag** - User-defined and AI-generated tags
```sql
CREATE TABLE customtag (
    pk_customtagid INT PRIMARY KEY,
    dk_itemid INT NOT NULL FK,
    tag_name VARCHAR(100) NOT NULL,
    tag_category VARCHAR(50) ('user_defined', 'ai_generated'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

### Modified Tables

#### **item** - Extended with tagging fields
```sql
ALTER TABLE item ADD (
    category VARCHAR(100),              -- Primary category
    subcategory VARCHAR(100),           -- Type within category
    primary_color VARCHAR(100),         -- Main color
    secondary_color VARCHAR(100),       -- Accent color
    brand VARCHAR(100),                 -- Brand/designer
    warmth_level VARCHAR(50),           -- Thermal rating
    fit VARCHAR(50)                     -- Fit style
);
```

**New Indexes:**
- `idx_item_category`
- `idx_item_subcategory`
- `idx_item_primary_color`
- `idx_item_secondary_color`
- `idx_item_brand`
- `idx_item_warmth_level`
- `idx_item_fit`
- `idx_item_category_subcategory` (composite)
- `idx_item_color_warmth` (composite)

---

#### **style** - Added style name field
```sql
ALTER TABLE style ADD COLUMN style_name VARCHAR(100);
```

**Default values:** casual, formal, business, sporty, bohemian, minimalist, vintage, trendy, preppy, edgy, romantic, athletic, classic

---

### Views

#### **item_with_tags** - Comprehensive item view
```sql
SELECT 
    item_id,
    dk_closet,
    itemtype,
    category,
    subcategory,
    primary_color,
    secondary_color,
    brand,
    warmth_level,
    fit,
    itemlikerating,
    itemcost,
    seasons,          -- JSON array
    styles,           -- JSON array
    occasions,        -- JSON array
    custom_tags       -- JSON array
FROM item_with_tags;
```

---

## API Endpoints

### Tagging Endpoints

All endpoints use the base URL: `https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage`

#### **GET /season**
Retrieve all seasons
```bash
curl -H "apikey: YOUR_API_KEY" \
  https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/season
```

**Response:**
```json
[\n  { "id": 1, "season_name": "spring" },\n  { "id": 2, "season_name": "summer" },\n  ...\n]\n```\n\n#### **GET /occasion**\nRetrieve all occasions\n```bash\ncurl -H \"apikey: YOUR_API_KEY\" \\\n  https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/occasion\n```\n\n#### **POST /itemtag**\nCreate an item tag association\n```bash\ncurl -X POST -H \"apikey: YOUR_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"dk_itemid\": 123,\n    \"dk_seasonid\": 2,\n    \"dk_styleid\": 5,\n    \"tag_source\": \"user\"\n  }' \\\n  https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/itemtag\n```\n\n#### **POST /customtag**\nCreate a custom tag\n```bash\ncurl -X POST -H \"apikey: YOUR_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"dk_itemid\": 123,\n    \"tag_name\": \"vintage-inspired\",\n    \"tag_category\": \"user_defined\"\n  }' \\\n  https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/customtag\n```\n\n#### **PUT /item/:id**\nUpdate item with new tagging fields\n```bash\ncurl -X PUT -H \"apikey: YOUR_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"category\": \"tops\",\n    \"subcategory\": \"shirt\",\n    \"primary_color\": \"blue\",\n    \"secondary_color\": \"white\",\n    \"brand\": \"Everlane\",\n    \"warmth_level\": \"cool\",\n    \"fit\": \"slim\"\n  }' \\\n  https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/item/123\n```\n\n#### **DELETE /itemtag/:id**\nDelete an item tag\n```bash\ncurl -X DELETE -H \"apikey: YOUR_API_KEY\" \\\n  https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage/itemtag/456\n```\n\n---\n\n## React Components\n\n### TagSelector\nGeneric multi-select tag component\n\n```tsx\nimport { TagSelector } from '@/components/TagSelector';\n\n<TagSelector\n  label=\"Seasons\"\n  selectedTags={selectedSeasons}\n  availableTags={['spring', 'summer', 'fall', 'winter']}\n  onTagsChange={setSelectedSeasons}\n  allowCustom={false}\n  searchable={true}\n  maxTags={3}\n/>\n```\n\n### CategorySelector\nHierarchical category picker\n\n```tsx\nimport { CategorySelector } from '@/components/CategorySelector';\n\n<CategorySelector\n  selectedCategory={category}\n  selectedSubcategory={subcategory}\n  onCategoryChange={setCategory}\n  onSubcategoryChange={setSubcategory}\n/>\n```\n\n### MultiSelect\nGeneric multi-select with optional color previews\n\n```tsx\nimport { MultiSelect, ColorPicker } from '@/components/MultiSelect';\n\n<MultiSelect\n  label=\"Occasions\"\n  options={occasionOptions}\n  selectedIds={selectedOccasionIds}\n  onSelectionChange={setSelectedOccasionIds}\n  maxSelections={3}\n/>\n\n<ColorPicker\n  label=\"Primary Color\"\n  selectedColor={primaryColor}\n  colors={COLOR_OPTIONS}\n  onColorChange={setPrimaryColor}\n  allowCustom={true}\n/>\n```\n\n---\n\n## Hooks\n\n### useTagMetadata()\nFetch and cache tag metadata (seasons, styles, occasions)\n\n```tsx\nconst { seasons, styles, occasions, loading, error, refetch } = useTagMetadata();\n```\n\n### useItemTags(itemId)\nManage tags for a specific item\n\n```tsx\nconst {\n  itemTags,\n  customTags,\n  loading,\n  error,\n  addTag,\n  removeTag,\n  addCustomTag,\n  removeCustomTag,\n  refetch,\n} = useItemTags(itemId);\n```\n\n### useTagFilter()\nManage filter state for items\n\n```tsx\nconst {\n  seasonIds,\n  styleIds,\n  occasionIds,\n  categoryFilter,\n  colorFilter,\n  warmthFilter,\n  buildFilterQuery,\n  resetFilters,\n  hasActiveFilters,\n} = useTagFilter();\n```\n\n### useTagSuggestions(itemData)\nGenerate tag suggestions based on item properties (AI-ready)\n\n```tsx\nconst { suggestions, loading, error, regenerate } = useTagSuggestions(itemData);\n```\n\n---\n\n## Constants & Types\n\n### Categories\n```tsx\nimport { CLOTHING_CATEGORIES, getSubcategoriesFor } from '@/lib/tagConstants';\n\n// Returns: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | ...\nconst subcategories = getSubcategoriesFor('tops');\n// Returns: ['shirt', 'blouse', 'tshirt', 'sweater', ...]\n```\n\n### Colors\n```tsx\nimport { COLOR_OPTIONS, getColorsArray } from '@/lib/tagConstants';\n// 20 predefined colors: white, black, red, blue, green, etc.\n```\n\n### Warmth Levels\n```tsx\nimport { WARMTH_LEVELS, WARMTH_LEVEL_TEMPS } from '@/lib/tagConstants';\n// very-cool, cool, neutral, warm, very-warm\n// With temperature ranges: very-cool → < 40°F\n```\n\n### Utility Functions\n```tsx\nimport { formatTagLabel, getCategoryGroups } from '@/lib/tagConstants';\n\nformatTagLabel('casual-dress'); // 'Casual Dress'\n```\n\n---\n\n## Migration Guide\n\n### Step 1: Run Main Migration\n```sql\n-- Apply schema changes\n-- Run: data/migration_001_tagging_system.sql\n```\n\n### Step 2: Populate Existing Data\n```sql\n-- Categorize existing items and initialize tags\n-- Run: data/migration_002_populate_tags.sql\n```\n\n### Step 3: Verify Migration\n```sql\nSELECT COUNT(*) as item_count\nFROM item_with_tags\nWHERE category IS NOT NULL;\n```\n\n### Step 4: Update Application Code\n- Import new components and hooks\n- Update ItemModal to include tag fields\n- Update search/filter pages\n\n### Rollback (if needed)\n```sql\n-- Remove all tagging system components\n-- Run: data/migration_rollback_tagging_system.sql\n```\n\n---\n\n## Usage Examples\n\n### Example 1: Creating an Item with Tags\n```tsx\nimport { ItemModal } from '@/components/ItemModal';\nimport { useTagMetadata } from '@/hooks/useTagManagement';\n\nfunction CreateItemWithTags() {\n  const { seasons, styles, occasions } = useTagMetadata();\n\n  return (\n    <ItemModal\n      onSave={async (itemData) => {\n        // Item created with category, colors, warmth_level, etc.\n        // Then add tags:\n        await addTag({\n          dk_itemid: itemData.id,\n          dk_seasonid: seasons[0].id,\n          dk_styleid: styles[0].id,\n          tag_source: 'user',\n        });\n      }}\n    />\n  );\n}\n```\n\n### Example 2: Filtering Items\n```tsx\nimport { useTagFilter } from '@/hooks/useTagManagement';\nimport { filterItemsByTags, sortItems } from '@/lib/tagFiltering';\n\nfunction InventoryFilter({ items }) {\n  const filter = useTagFilter();\n\n  const filtered = filterItemsByTags(items, {\n    categories: filter.categoryFilter ? [filter.categoryFilter] : undefined,\n    warmthLevels: filter.warmthFilter ? [filter.warmthFilter as WarmthLevel] : undefined,\n    primaryColors: filter.colorFilter ? [filter.colorFilter as ColorOption] : undefined,\n  });\n\n  const sorted = sortItems(filtered, 'newest');\n\n  return (\n    <div>\n      {/* Filter UI */}\n      {sorted.map((item) => (\n        <ItemCard key={item.id} item={item} />\n      ))}\n    </div>\n  );\n}\n```\n\n### Example 3: Tag Management UI\n```tsx\nimport { useItemTags } from '@/hooks/useTagManagement';\nimport { TagSelector } from '@/components/TagSelector';\n\nfunction ItemTagManager({ itemId, seasons }) {\n  const { customTags, addCustomTag, removeCustomTag } = useItemTags(itemId);\n  const [newTag, setNewTag] = useState('');\n\n  return (\n    <div>\n      <TagSelector\n        label=\"Add Seasons\"\n        selectedTags={customTags.filter(t => t.tag_category === 'user_defined').map(t => t.tag_name)}\n        availableTags={seasons.map(s => s.season_name)}\n        onTagsChange={(tags) => {\n          // Update tags\n        }}\n        allowCustom={true}\n      />\n\n      <button onClick={() => addCustomTag(newTag, 'user_defined')}>\n        Add Custom Tag\n      </button>\n    </div>\n  );\n}\n```\n\n---\n\n## AI Integration (Ready)\n\nThe tagging system is designed to support future AI-generated tags.\n\n### AI Tag Flow\n```\n1. User uploads item with photo\n2. Image sent to AI vision API\n3. AI generates tags: category, colors, style suggestions\n4. Tags stored in customtag table with tag_category='ai_generated'\n5. User can accept/reject/edit AI suggestions\n```\n\n### Implementation Ready\n```tsx\n// In useTagSuggestions hook, extend generateSuggestions():\nconst aiTags = await callAITaggingService(itemData, photoUrl);\nSuggestions.push(...aiTags.map(tag => ({\n  name: tag.name,\n  confidence: tag.confidence,\n  source: 'ai'\n})));\n```\n\n### Storing AI Tags\n```tsx\nawait addCustomTag(aiTag.name, 'ai_generated');\n```\n\n---\n\n## Performance Optimization Tips\n\n1. **Use Indexes** - All tag fields have indexes for fast filtering\n2. **Lazy Load Tags** - Load custom tags only when item detail page is opened\n3. **Cache Metadata** - useTagMetadata() caches seasons/styles/occasions\n4. **Batch Updates** - Use Promise.all() for multiple tag operations\n5. **View for Complex Queries** - item_with_tags view optimizes multi-table queries\n\n---\n\n## Type Definitions\n\n```tsx\n// src/types.ts\nexport interface Item {\n  id: number;\n  category?: string;\n  subcategory?: string;\n  primary_color?: string;\n  secondary_color?: string;\n  brand?: string;\n  warmth_level?: string;\n  fit?: string;\n  // ... existing fields\n}\n\nexport interface ItemTag {\n  id: number;\n  dk_itemid: number;\n  dk_seasonid?: number;\n  dk_styleid?: number;\n  dk_occasionid?: number;\n  tag_source: 'system' | 'user' | 'ai';\n}\n\nexport interface CustomTag {\n  id: number;\n  dk_itemid: number;\n  tag_name: string;\n  tag_category: 'user_defined' | 'ai_generated';\n}\n```\n\n---\n\n## Support & Troubleshooting\n\n### Issue: Tags not appearing after creation\n**Solution:** Ensure tag_source is set to 'user' or 'system', not null\n\n### Issue: Duplicate tag errors\n**Solution:** Check unique constraints on itemtag table - don't add same tag combination twice\n\n### Issue: Slow queries on large wardrobes\n**Solution:** Ensure indexes are created, use item_with_tags view for complex queries\n\n### Issue: AI integration not working\n**Solution:** useTagSuggestions is a placeholder - implement AI service integration as needed\n\n---\n\n**Last Updated:** May 23, 2024\n**Version:** 1.0.0\n