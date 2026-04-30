# HeyCloset

HeyCloset is a personal wardrobe management platform that gives you a complete digital twin of your physical clothing collection. It tracks items across multiple homes and closets, logs wear and wash history, calculates cost-per-wear analytics, and manages outfit combinations — all through a React SPA backed by Supabase Edge Functions.

---

## Table of Contents

1. [Platform Summary](#platform-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Data Model](#data-model)
5. [API Reference](#api-reference)
6. [Pages & Functionality](#pages--functionality)
7. [Hooks & Services](#hooks--services)
8. [Components](#components)
9. [Deployment](#deployment)
10. [Local Development](#local-development)

---

## Platform Summary

HeyCloset solves the problem of wardrobe sprawl across multiple locations. Key capabilities:

- **Multi-home, multi-closet hierarchy** — Items live at `Home → Closet → Partition`
- **Wear logging** — Record every time an item is worn, enabling cost-per-wear tracking
- **Laundry kanban** — Move items through Clean → Dirty → Washing → Drying states
- **Fashion ROI analytics** — CPW leaderboard, spending by month, style DNA, dormant item alerts
- **Outfit archive** — Curate and save named outfit combinations with occasion/season tags
- **Reference photos** — Upload and manage item photos via Supabase Storage
- **Dimensional tag search** — Filter inventory by colour, style, and material metadata
- **Wash health protocol** — Alert on items unwashed for 30+ days

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│                                              │
│   React 19 SPA  (Vite, TypeScript, Router)  │
│                                              │
│  Pages → Hooks → api.ts (fetch) → Supabase  │
└──────────────────────┬──────────────────────┘
                       │ HTTPS REST
          ┌────────────▼────────────┐
          │  Supabase Edge Function  │
          │  /functions/v1/<table>   │
          │  Auth: apikey header     │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │     Supabase Postgres    │
          │  Tables: item, home,     │
          │  storage, colour,        │
          │  material, style, info,  │
          │  wash, wearlog, outfit,  │
          │  outfititem, itemphoto   │
          └─────────────────────────┘
          ┌─────────────────────────┐
          │   Supabase Storage      │
          │   Bucket: item-photos   │
          │   Public read, auth write│
          └─────────────────────────┘
```

**Request flow:**
1. A React hook calls `api.list / api.get / api.create / api.update / api.delete`
2. `api.ts` prepends `https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1` and attaches the `apikey` header from `VITE_SUPABASE_API_KEY`
3. The Supabase Edge Function authenticates and executes the Postgres query
4. JSON is returned and typed via TypeScript interfaces in `src/types.ts`

**Photo uploads** bypass the Edge Function and POST directly to the Supabase Storage REST API at `/storage/v1/object/item-photos/{itemId}/{filename}`.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19 |
| Language | TypeScript | ~5.8 |
| Build Tool | Vite | ^6.2 |
| Styling | Tailwind CSS | ^4.1 |
| Routing | React Router | ^7 |
| Animations | Motion (Framer Motion) | ^12 |
| Icons | Lucide React | ^0.546 |
| Date utilities | date-fns | ^4.1 |
| Backend | Supabase Edge Functions | — |
| Database | Supabase Postgres | — |
| File Storage | Supabase Storage | — |
| Deployment | Vercel | — |

---

## Data Model

### Core tables

| Table | Primary Key | Description |
|---|---|---|
| `home` | `pk_homelocation` | Physical residence |
| `storage` | `pk_closet` | Closet/wardrobe unit within a home |
| `item` | `pk_item` | Single clothing item |
| `colour` | `id` | Colour descriptor (overall / inner / outer) |
| `material` | `id` | Fabric descriptor (texture / softness / thickness) |
| `style` | `id` | Style descriptor (type / year / fit size) |
| `info` | `id` | Junction: links item ↔ colour ↔ material ↔ style |
| `wash` | `id` | Wash event record for an item |
| `wearlog` | `id` | Wear event record for an item |
| `outfit` | `id` | Named outfit combination |
| `outfititem` | `id` | Junction: links outfit ↔ item |
| `itemphoto` | `id` | Reference photo record for an item |
| `for_location` | `id` | Style-to-venue mapping |

### Key foreign keys

```
storage.dk_homelocation → home.pk_homelocation
item.dk_closet          → storage.pk_closet
info.dk_itemid          → item.pk_item
info.dk_colourid        → colour.id
info.dk_material        → material.id
info.dk_styleid         → style.id
wash.dk_itemid          → item.pk_item
wearlog.dk_itemid       → item.pk_item
outfititem.dk_outfitid  → outfit.id
outfititem.dk_itemid    → item.pk_item
itemphoto.dk_itemid     → item.pk_item
for_location.dk_styleid → style.id
```

### Required schema additions

Run these SQL statements in the Supabase SQL editor to enable all features:

```sql
-- Add laundry status to item
ALTER TABLE item
  ADD COLUMN IF NOT EXISTS wash_status TEXT NOT NULL DEFAULT 'clean'
    CHECK (wash_status IN ('clean', 'dirty', 'washing', 'drying'));

-- Add tag source to info
ALTER TABLE info
  ADD COLUMN IF NOT EXISTS tag_source TEXT NOT NULL DEFAULT 'user'
    CHECK (tag_source IN ('user', 'system'));

-- Wear log table
CREATE TABLE IF NOT EXISTS wearlog (
  id          BIGSERIAL PRIMARY KEY,
  dk_itemid   BIGINT NOT NULL REFERENCES item(pk_item) ON DELETE CASCADE,
  worn_date   DATE NOT NULL,
  outfit_id   BIGINT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit table
CREATE TABLE IF NOT EXISTS outfit (
  id          BIGSERIAL PRIMARY KEY,
  outfitname  TEXT NOT NULL,
  occasion    TEXT NOT NULL,
  season      TEXT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit ↔ Item junction
CREATE TABLE IF NOT EXISTS outfititem (
  id           BIGSERIAL PRIMARY KEY,
  dk_outfitid  BIGINT NOT NULL REFERENCES outfit(id) ON DELETE CASCADE,
  dk_itemid    BIGINT NOT NULL REFERENCES item(pk_item) ON DELETE CASCADE
);

-- Item photo records
CREATE TABLE IF NOT EXISTS itemphoto (
  id            BIGSERIAL PRIMARY KEY,
  dk_itemid     BIGINT NOT NULL REFERENCES item(pk_item) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  caption       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

Also create a public Supabase Storage bucket named **`item-photos`**, and register the new tables (`wearlog`, `outfit`, `outfititem`, `itemphoto`) in the Edge Function router.

---

## API Reference

**Base URL:** `https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1`

**Authentication:** All requests require the header:
```
apikey: <SUPABASE_ANON_KEY>
```

### Generic CRUD pattern

Every table follows the same REST pattern:

| Operation | Method | Path | Body |
|---|---|---|---|
| List all | `GET` | `/<table>` | — |
| List with filter | `GET` | `/<table>?field=value` | — |
| Get by ID | `GET` | `/<table>/:id` | — |
| Create | `POST` | `/<table>` | JSON object |
| Update | `PUT` | `/<table>/:id` | Partial JSON |
| Delete | `DELETE` | `/<table>/:id` | — |

### Supported filter parameters

| Table | Query parameters |
|---|---|
| `storage` | `dk_homelocation` |
| `item` | `dk_closet` |
| `info` | `dk_itemid`, `dk_styleid`, `dk_colourid`, `dk_material` |
| `wash` | `dk_itemid` |
| `wearlog` | `dk_itemid` |
| `outfititem` | `dk_outfitid`, `dk_itemid` |
| `itemphoto` | `dk_itemid` |
| `for_location` | `dk_styleid` |

### Photo upload (Supabase Storage)

```
POST https://nuqpcxgonlqlxtujxmhx.supabase.co/storage/v1/object/item-photos/{itemId}/{filename}
Headers:
  Authorization: Bearer <SUPABASE_ANON_KEY>
  Content-Type: <file mime type>
Body: raw file bytes
```

Public read URL: `https://nuqpcxgonlqlxtujxmhx.supabase.co/storage/v1/object/public/item-photos/{path}`

### Example requests

```bash
# List all items
GET /item

# List items in closet 3
GET /item?dk_closet=3

# Create a new item
POST /item
{ "dk_closet": 1, "itemtype": "Shirt", "itemsize": "M",
  "isoncamera": true, "itemlikerating": 8, "itemcost": 49.99,
  "itemcomment": "Favourite shirt", "itemwashmethod": "Machine wash cold" }

# Log a wear event
POST /wearlog
{ "dk_itemid": 42, "worn_date": "2026-04-30", "notes": "Work meeting" }

# Update laundry status
PUT /item/42
{ "wash_status": "dirty" }

# Get all info records for item 42
GET /info?dk_itemid=42
```

---

## Pages & Functionality

### Dashboard (`/`)

**File:** `src/pages/Dashboard.tsx`

Summary cards showing total items, number of homes, and storage units. Below that: a "Recently Archived" list of the 5 latest items, and a "Storage Breakdown" per home showing item count per closet.

API calls: `useDashboardData` → `GET /home`, `GET /storage`, `GET /item`

---

### Warehouse (`/warehouse`)

**File:** `src/pages/Warehouse.tsx`

Hierarchical drill-down navigator. Three-level breadcrumb: **Home → Closet → Partition**. Click a home to see its closets, click a closet to see its partitions, click a partition to see the items stored there.

- Grid/list view toggle for items
- "Add Storage" button opens `StorageModal` to create a new `storage` record
- Item cards link to `ItemDetail`
- Shows item type counts by category within the partition

API calls: `useDashboardData`, `POST /storage` (via modal)

---

### Inventory (`/inventory`)

**File:** `src/pages/Inventory.tsx`

Global flat list of every item across all locations.

- Full-text search on type and comment fields
- Sort by: Item Type, Cost, Rating (asc/desc toggle)
- Filter panel (collapsible): filter by Home location, Wash Status, Item Type
- Active filter count badge on filter button
- "Add Item" opens `ItemModal` to create item + colour/material/style + `info` junction record in one flow
- Each row shows: SVG clothing icon, type, size, cost, home → closet path, wash status badge
- Link to `ItemDetail` per item

API calls: `useDashboardData`, `POST /item` + `POST /colour` + `POST /material` + `POST /style` + `POST /info` (via modal)

---

### Item Detail (`/item/:id`)

**File:** `src/pages/ItemDetail.tsx`

Full detail view for a single item. Three action buttons in the header: **Log Wear**, **Edit**, **Delete**.

Sections:
- **Hero** — Primary photo (or SVG icon fallback), item type, size, ID, `wash_status` badge
- **Laundry Status** — Four toggle buttons (Clean / Dirty / Washing / Drying); selecting one PUTs `wash_status` immediately
- **Item Details** — Cost, rating (star display), wash method, camera status, comment
- **Preference Details** — Colour, material, style tags with Manual/AI badge (`tag_source`), CPW badge
- **Wear History** — List of recent `wearlog` entries with date and notes
- **Reference Photos** — `ImageUpload` component for drag-and-drop photo management

Modals triggered from this page: `EditItemModal`, `DeleteConfirmModal` (navigates to `/inventory` after delete), `WearLogModal`

API calls: `GET /item/:id`, `GET /info?dk_itemid`, `GET /wash?dk_itemid`, `GET /wearlog?dk_itemid`, `GET /itemphoto?dk_itemid`, `GET /storage/:id`, `GET /home/:id`, `GET /style/:id`, `GET /colour/:id`, `GET /material/:id`

---

### Tag Explorer / Advanced Search (`/search`)

**File:** `src/pages/AdvancedSearch.tsx`

Multi-dimensional metadata search. Three filter panels (Colour, Style, Material) show all available tags as clickable chips. Results update in real time as tags are toggled — only items with matching `info` records are shown.

- Reset button clears all filters
- Results show: SVG icon, type, size, full location path (`Home → Closet → Partition`), link to detail
- Requires at least one filter selected before showing results

API calls: `useDashboardData` + `useMetadata` → `GET /colour`, `GET /material`, `GET /style`, `GET /info`

---

### Wash Tracker (`/washes`)

**File:** `src/pages/WashTracker.tsx`

Tracks cleaning history per item. Items are sorted by days since last wash; items unwashed for 30+ days show a red critical alert badge.

- Click an item to open `WashModal` and log a new wash date
- Shows last wash date and elapsed days for each item
- Items with no wash record show "Never washed"

API calls: `useDashboardData`, `GET /wash`, `POST /wash` (via modal)

---

### Laundry Tracker (`/laundry`)

**File:** `src/pages/Laundry.tsx`

Kanban board with four columns: **Clean**, **Dirty**, **Washing**, **Drying**.

- Items are assigned to columns based on their `wash_status` field
- Each card shows: SVG icon, item type, home/closet location, size
- Action button advances the item to the next logical state: dirty → washing → drying → clean (and clean → dirty)
- Progress is persisted immediately via `PUT /item/:id`
- Header shows count of items currently in progress

API calls: `useDashboardData`, `PUT /item/:id`

---

### Analytics (`/analytics`)

**File:** `src/pages/Analytics.tsx`

Fashion ROI dashboard. Four summary stat cards at top: Total Spend, Total Wears Logged, Average CPW, Dormant Item count.

Four sections:
1. **Cost Per Wear table** — All items sorted by CPW (best → worst), coloured CPW badge, wear count, links to detail
2. **Spending by Month** — CSS bar chart built from `item.created_at` purchase dates, capped to last 12 months
3. **Style DNA** — Horizontal bar chart of most frequently worn colours (from wear logs ↔ info ↔ colour)
4. **Dormant Items** — Items with no wear logged in the last 6 months; links to detail page

API calls: `useAnalytics` → `GET /item`, `GET /wearlog`, `GET /info`, `GET /colour`

---

### Outfit Archive (`/outfits`)

**File:** `src/pages/Outfits.tsx`

Grid of saved outfit combinations.

- Each card shows: strip of SVG clothing icons (up to 6), outfit name, occasion badge, season badge, item count
- "New Outfit" opens `OutfitModal` to name the outfit, set occasion/season, and pick items from inventory
- Delete button per card opens `DeleteConfirmModal`

API calls: `useOutfits` → `GET /outfit`, `GET /outfititem`, `GET /item`; `POST /outfit` + `POST /outfititem` (via modal); `DELETE /outfit/:id`

---

## Hooks & Services

### `src/services/api.ts`

Central API client. All methods return typed Promises.

```typescript
api.list<T>(table, query?)     // GET /<table>?params
api.get<T>(table, id)          // GET /<table>/:id
api.create<T>(table, data)     // POST /<table>
api.update<T>(table, id, data) // PUT /<table>/:id
api.delete(table, id)          // DELETE /<table>/:id
api.uploadPhoto(itemId, file)  // POST to Supabase Storage
api.getPhotoUrl(path)          // Returns public Storage URL
```

Auth header (`apikey`) is read from `VITE_SUPABASE_API_KEY` at build time via Vite's `loadEnv`.

### `src/hooks/useDashboardData.ts`

Fetches and normalises `home`, `storage`, and `item` records. Handles the API's `pk_homelocation` / `pk_closet` / `pk_item` primary key aliasing (maps all to `.id`). Returns `{ homes, storages, items, loading, error, refetch }`.

### `src/hooks/useMetadata.ts`

Fetches `colour`, `material`, `style`, and `info` in parallel. Used by AdvancedSearch and ItemDetail. Returns `{ colours, materials, styles, infos, loading }`.

### `src/hooks/useAnalytics.ts`

Fetches items, wear logs, info, and colours, then computes:
- CPW per item (sorted best → worst, `Infinity` for unworn items)
- Spending grouped by calendar month
- Colour wear frequency (dominant colours)
- Dormant items (no `wearlog` in last 6 months)

Returns `{ data: AnalyticsData, loading, error }`.

### `src/hooks/useOutfits.ts`

Fetches `outfit`, `outfititem`, and `item` records, then joins them into `OutfitWithItems[]`. Returns `{ outfits, allItems, loading, error, refetch }`.

---

## Components

| Component | Purpose |
|---|---|
| `PageContainer` | Shared page shell with title, subtitle, actions slot |
| `ItemModal` | Create a new item (item + colour + material + style + info in one transaction) |
| `EditItemModal` | Edit an existing item's fields |
| `DeleteConfirmModal` | Generic deletion confirmation dialog |
| `StorageModal` | Add a new storage unit to a home |
| `WashModal` | Log a wash event date for an item |
| `WearLogModal` | Log a wear event for an item |
| `OutfitModal` | Create a named outfit by selecting items |
| `ImageUpload` | Drag-and-drop photo uploader + gallery (validates JPEG/PNG/WebP, max 10 MB) |
| `CPWBadge` | Coloured cost-per-wear pill (green ≤$1, blue ≤$5, amber ≤$20, red >$20) |
| `ItemSVGIcon` | Renders a clothing-type SVG icon from `src/lib/itemIcons.ts` (16 types + fallback) |

---

## Deployment

### Vercel (recommended)

1. Push this repository to GitHub.
2. In the [Vercel dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Under **Environment Variables**, add:
   ```
   VITE_SUPABASE_API_KEY = <your Supabase anon key>
   ```
4. Leave the build settings as auto-detected (Vite):
   - **Build command:** `vite build`
   - **Output directory:** `dist`
5. Click **Deploy**.

`vercel.json` is pre-configured to rewrite all paths to `index.html` for SPA client-side routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### CORS

The Supabase Edge Function must allow your deployment domain. In Supabase: **Edge Functions → storage → Settings** — add your Vercel domain to the allowed origins.

### Supabase backend checklist

Before deploying for the first time, ensure these are complete:

- [ ] Run the schema migration SQL (see [Data Model](#data-model) section above)
- [ ] Create `item-photos` Storage bucket (Public)
- [ ] Register `wearlog`, `outfit`, `outfititem`, `itemphoto` routes in the Edge Function
- [ ] Confirm RLS policies or disable RLS for Edge Function service-role access

---

## Local Development

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone and install
git clone <repo-url>
cd hey-closet
npm install

# 2. Create environment file
echo "VITE_SUPABASE_API_KEY=your_supabase_anon_key" > .env

# 3. Start dev server (http://localhost:3000)
npm run dev

# 4. Type-check without building
npm run lint

# 5. Production build
npm run build

# 6. Preview production build locally
npm run preview
```

The dev server runs on port 3000 with `--host 0.0.0.0` (accessible on local network).

---

*HeyCloset — Your wardrobe, digitally mastered.*
