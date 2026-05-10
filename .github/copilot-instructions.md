# HeyCloset — Copilot Instructions

## Project Overview
HeyCloset is a personal wardrobe warehouse management SPA. It tracks clothing items across multiple homes using a hierarchical model: **Home → Closet → Partition → Items**, with dimensional metadata tagging (colour, style, material) and a wash health protocol.

## Tech Stack
- **React 19**, TypeScript, Vite
- **Tailwind CSS** for styling, **Lucide Icons** for icons, **Framer Motion** for animations
- **React Router v7** for routing
- **Supabase** backend via Edge Functions (REST, not the Supabase JS client)
- **date-fns** for all date math

## Architecture

### API Layer (`src/services/api.ts`)
All data access goes through the generic `api` service. Never call `fetch` directly in components or hooks.
- `api.list<T>(table, query?)` — GET all records
- `api.get<T>(table, id)` — GET single record
- `api.create<T>(table, data)` — POST
- `api.update<T>(table, id, data)` — PUT
- `api.delete(table, id)` — DELETE

Base URL: `https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage`  
Auth header: `VITE_SUPABASE_API_KEY` (env var, never hardcode).

### Data Models (`src/types.ts`)

**Important**: API responses use `pk_*` field names; hooks remap them to `id`. Always use the remapped shape downstream.

#### Database Schema

**home** — Storage locations (user homes/buildings)
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_homelocation` | INT (identity) | Primary Key | Remapped to `id` |
| `homename` | VARCHAR(100) | – | Home/location name |
| `homeaddress` | VARCHAR(200) | – | Physical address |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

**storage** — Closets/wardrobes within homes (contains partitions and items)
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_closet` | INT (identity) | Primary Key | Remapped to `id` |
| `dk_homelocation` | INT | Foreign Key → home | Which home this closet belongs to |
| `closet` | VARCHAR(100) | – | Closet name |
| `closetpartition` | VARCHAR(100) | – | Partition/section within closet |
| `hasstoragecover` | BOOLEAN | – | Whether it has a cover |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

**item** — Individual clothing pieces
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_itemid` | INT (identity) | Primary Key | Remapped to `id` |
| `dk_closet` | INT | Foreign Key → storage (CASCADE delete) | Which closet item is in |
| `itemtype` | VARCHAR(100) | NOT NULL | Type of garment (e.g., "shirt", "pants") |
| `itemsize` | VARCHAR(50) | – | Size (S, M, L, etc.) |
| `itemcost` | NUMERIC(10, 2) | CHECK ≥ 0 | Purchase price |
| `itemlikerating` | SMALLINT | CHECK 1–10 | User preference rating |
| `itemwashmethod` | VARCHAR(100) | – | Wash instructions |
| `itemcomment` | VARCHAR(500) | – | Additional notes |
| `isoncamera` | BOOLEAN | – | If item has photo documentation |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

**colour** — Colour metadata for items
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_colourid` | INT (identity) | Primary Key | Remapped to `id` |
| `colouroverall` | VARCHAR(100) | – | Primary colour |
| `majorcolour` | VARCHAR(100) | – | Major colour (for layered items) |
| `minorcolour` | VARCHAR(100) | – | Minor colour (for layered items) |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

**material** — Material metadata for items
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_material` | INT (identity) | Primary Key | Remapped to `id` |
| `texture` | VARCHAR(100) | – | Surface texture (e.g., "smooth", "knit") |
| `softness` | VARCHAR(100) | – | Softness level |
| `thickness` | VARCHAR(100) | – | Fabric thickness |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

**style** — Style metadata for items
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_styleid` | INT (identity) | Primary Key | Remapped to `id` |
| `styletype` | VARCHAR(100) | – | Style category (e.g., "casual", "formal") |
| `styleyear` | SMALLINT | – | Era/year the style is from |
| `stylefitsize` | VARCHAR(50) | – | Fit descriptor (e.g., "slim", "relaxed") |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

**info** — Junction table linking items to dimensional metadata
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_infoid` | INT (identity) | Primary Key | – |
| `dk_itemid` | INT | Foreign Key → item (CASCADE delete) | Item reference |
| `dk_styleid` | INT | Foreign Key → style | Style reference |
| `dk_colourid` | INT | Foreign Key → colour | Colour reference |
| `dk_material` | INT | Foreign Key → material | Material reference |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |
| Unique Constraint | UNIQUE(dk_itemid, dk_styleid, dk_colourid, dk_material) | – | Prevents duplicate metadata combinations |

**wash** — Wash health tracking for items
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_wash` | INT (identity) | Primary Key | Remapped to `id` |
| `dk_itemid` | INT | Foreign Key → item (CASCADE delete) | Item being tracked |
| `lastwashdate` | DATE | – | Last wash date; critical threshold is 30+ days |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

**for_location** — Location-based styling information
| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pk_forlocationid` | INT (identity) | Primary Key | – |
| `dk_styleid` | INT | Foreign Key → style | Associated style |
| `forlocationtype` | VARCHAR(100) | – | Location type (e.g., "office", "beach") |
| `forlocationaddress` | VARCHAR(200) | – | Specific address/description |
| `isforlocationindoor` | BOOLEAN | – | Whether it's an indoor location |
| `created_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | – |
| `updated_at` | TIMESTAMP | Default: CURRENT_TIMESTAMP | Auto-updated on write |

#### Hierarchy & Relationships
- **Home** → many **Storage** (closets/wardrobes)
- **Storage** → many **Item** (individual pieces)
- **Item** ← one **Wash** (health tracking, 1:1 relationship)
- **Item** ← many **Info** entries (can have multiple metadata combinations)
- **Info** → **Colour**, **Material**, **Style** (dimensional metadata)

### Hooks (`src/hooks/`)
- `useDashboardData()` — homes, storages, items; exposes `loading`, `error`, `refetch`
- `useMetadata()` — colours, materials, styles, infos for tag search
- Other hooks for analytics, outfits, theme

### Pages (`src/pages/`)
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Stats overview, recent items |
| `/warehouse` | Warehouse | Hierarchical drill-down explorer |
| `/inventory` | Inventory | Global item list with search/sort |
| `/search` | AdvancedSearch | Multi-dimensional metadata filtering |
| `/washes` | WashTracker | Wash health protocol (critical = 30+ days) |
| `/item/:id` | ItemDetail | Full item details, edit, delete |

### Components (`src/components/`)
- **PageContainer** — layout wrapper; props: `children`, `title`, `subtitle`, `actions`
- **ItemModal** — create item form; creates associated colour/material/style records
- **StorageModal** — create storage; supports inline home creation
- **WashModal** — log wash date; defaults to today
- **EditItemModal**, **EditStorageModal**, **EditHomeModal** — edit counterparts
- **DeleteConfirmModal** — reusable delete confirmation

## Conventions
- Use `PageContainer` for every page layout — no custom page wrappers.
- After any create/update/delete, call `refetch()` from the hook — do not manually mutate local state.
- Wash status threshold is **30 days** (critical). Keep this consistent across UI and logic.
- All dates use `date-fns`; store as ISO strings in the API.
- Like rating is always an integer 1–5.
- Foreign key field names follow the `dk_*` convention (dimension key).

## Build & Deploy
```bash
npm install
npm run dev       # local dev
npm run build     # production build (Vite)
```
Deployed on Vercel as a static SPA. Env var `VITE_SUPABASE_API_KEY` must be set.
