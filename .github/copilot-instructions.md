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
| Table | Key Fields |
|-------|-----------|
| Home | `id` (mapped from `pk_homelocation`), `homename`, `homeaddress` |
| Storage | `id` (mapped from `pk_closet`), `closet`, `closetpartition`, `hasstoragecover`, `dk_homelocation` |
| Item | `id` (mapped from `pk_item`), `dk_closet`, `itemtype`, `itemsize`, `itemcost`, `itemlikerating` (1–5), `itemwashmethod`, `isoncamera` |
| Wash | `id`, `dk_itemid`, `lastwashdate` |
| Colour | `id`, `colouroverall`, `colourinner`, `colourouter` |
| Material | `id`, `texture`, `softness`, `thickness` |
| Style | `id`, `styletype`, `styleyear`, `stylefitsize` |
| Info | Junction table linking Item → Colour/Material/Style via `dk_itemid`, `dk_styleid`, `dk_colourid`, `dk_material` |

**Important**: API responses use `pk_*` field names; hooks remap them to `id`. Always use the remapped shape downstream.

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
