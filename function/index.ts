// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const allowedOrigins = [
  'https://hey-closet.vercel.app',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  }
}

// --- Interfaces

interface Colour {
  pk_colourid?: number
  colouroverall?: string | null
  colourinner?: string | null
  colourouter?: string | null
}

interface ForLocation {
  pk_forlocationid?: number
  dk_styleid: number
  forlocationaddress?: string | null
  forlocationtype?: string | null
  isforlocationindoor?: boolean | null
}

interface Home {
  pk_homelocation?: number
  homename?: string | null
  homeaddress?: string | null
}

interface Info {
  pk_infoid?: number
  dk_itemid: number
  dk_styleid: number
  dk_colourid: number
  dk_material: number
}

interface Item {
  pk_itemid?: number
  dk_closet: number
  itemtype: string
  itemsize?: string | null
  isoncamera?: boolean | null
  itemlikerating?: number | null
  itemcost?: number | null
  itemcomment?: string | null
  itemwashmethod?: string | null
}

interface Material {
  pk_material?: number
  texture?: string | null
  softness?: string | null
  thickness?: string | null
}

interface Storage {
  pk_closet?: number
  closet?: string | null
  closetpartition?: string | null
  hasstoragecover?: boolean | null
  dk_homelocation: number
}

interface Style {
  pk_styleid?: number
  styletype?: string | null
  styleyear?: number | null
  stylefitsize?: string | null
}

interface Wash {
  pk_wash?: number
  dk_itemid: number
  lastwashdate?: string | null
}

// --- Table config: maps URL segment -> table name & primary key column

const TABLE_CONFIG: Record<string, { table: string; pk: string }> = {
  colour:       { table: 'colour',       pk: 'pk_colourid'      },
  for_location: { table: 'for_location', pk: 'pk_forlocationid' },
  home:         { table: 'home',         pk: 'pk_homelocation'  },
  info:         { table: 'info',         pk: 'pk_infoid'        },
  item:         { table: 'item',         pk: 'pk_itemid'        },
  material:     { table: 'material',     pk: 'pk_material'      },
  storage:      { table: 'storage',      pk: 'pk_closet'        },
  style:        { table: 'style',        pk: 'pk_styleid'       },
  wash:         { table: 'wash',         pk: 'pk_wash'          },
}

// Query params that are allowed as filters per table (foreign key columns)
const ALLOWED_FILTERS: Record<string, string[]> = {
  for_location: ['dk_styleid'],
  info:         ['dk_itemid', 'dk_styleid', 'dk_colourid', 'dk_material'],
  item:         ['dk_closet'],
  storage:      ['dk_homelocation'],
  wash:         ['dk_itemid'],
}

// Tables that expose a joined select (Supabase PostgREST syntax)
const JOINED_SELECT: Record<string, string> = {
  info: '*, colour(*), style(*), item(*), material(*)',
  item: '*, storage(*)',
  wash: '*, item(*)',
  for_location: '*, style(*)',
  storage: '*, home(*)',
}

// --- Generic CRUD helpers

function json(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

async function getAll(
  supabase: SupabaseClient,
  resource: string,
  searchParams: URLSearchParams,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { table, pk } = TABLE_CONFIG[resource]
  const selectClause = JOINED_SELECT[resource] ?? '*'
  let query = supabase.from(table).select(selectClause).order(pk, { ascending: true })

  const allowed = ALLOWED_FILTERS[resource] ?? []
  for (const col of allowed) {
    const val = searchParams.get(col)
    if (val !== null) query = query.eq(col, val)
  }

  const { data, error } = await query
  if (error) throw error
  return json({ data }, corsHeaders)
}

async function getOne(
  supabase: SupabaseClient,
  resource: string,
  id: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { table, pk } = TABLE_CONFIG[resource]
  const selectClause = JOINED_SELECT[resource] ?? '*'
  const { data, error } = await supabase.from(table).select(selectClause).eq(pk, id).single()
  if (error) throw error
  return json({ data }, corsHeaders)
}

async function createOne(
  supabase: SupabaseClient,
  resource: string,
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { table } = TABLE_CONFIG[resource]
  const { data, error } = await supabase.from(table).insert(body).select()
  if (error) throw error
  return json({ data: data?.[0] ?? null }, corsHeaders, 201)
}

async function updateOne(
  supabase: SupabaseClient,
  resource: string,
  id: string,
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { table, pk } = TABLE_CONFIG[resource]
  const { data, error } = await supabase.from(table).update(body).eq(pk, id).select()
  if (error) throw error
  return json({ data: data?.[0] ?? null }, corsHeaders)
}

async function deleteOne(
  supabase: SupabaseClient,
  resource: string,
  id: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { table, pk } = TABLE_CONFIG[resource]
  const { error } = await supabase.from(table).delete().eq(pk, id)
  if (error) throw error
  return new Response(null, { headers: corsHeaders, status: 204 })
}

Deno.serve(async (req) => {
  const { url, method } = req
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  // Pre-flight CORS
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const urlObj = new URL(url)
    const searchParams = urlObj.searchParams

    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    const tableIdx = pathParts.findIndex((p, i) => {
      if (!TABLE_CONFIG[p]) return false
      const next = pathParts[i + 1]
      return !next || !TABLE_CONFIG[next]
    })
    const resource = tableIdx !== -1 ? pathParts[tableIdx] : ''
    const nextSegment = tableIdx !== -1 ? pathParts[tableIdx + 1] : undefined
    // Only treat the next segment as an ID if it is not itself a table name
    const resourceId = nextSegment && !TABLE_CONFIG[nextSegment] ? nextSegment : null

    if (resource && TABLE_CONFIG[resource]) {
      let body: Record<string, unknown> = {}
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        body = await req.json()
      }

      switch (true) {
        case !resourceId && method === 'GET':
          return getAll(supabaseClient, resource, searchParams, corsHeaders)
        case !resourceId && method === 'POST':
          return createOne(supabaseClient, resource, body, corsHeaders)
        case !!resourceId && method === 'GET':
          return getOne(supabaseClient, resource, resourceId!, corsHeaders)
        case !!resourceId && (method === 'PUT' || method === 'PATCH'):
          return updateOne(supabaseClient, resource, resourceId!, body, corsHeaders)
        case !!resourceId && method === 'DELETE':
          return deleteOne(supabaseClient, resource, resourceId!, corsHeaders)
        default:
          return json({ error: 'Method not allowed' }, corsHeaders, 405)
      }
    }

    return json({ error: 'Not found' }, corsHeaders, 404)
  } catch (error) {
    console.error(error)

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
