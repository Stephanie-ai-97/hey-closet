// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.25.76'

const allowedOrigins = [
  'https://hey-closet.vercel.app',
  'http://localhost:3000',
]

const scanRateLimits = new Map<string, { count: number; resetAt: number }>()
const SCAN_WINDOW_MS = 60_000
const SCAN_LIMIT = 6

const clothingCategories = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'activewear',
  'sleepwear',
  'intimates',
] as const

const clothingSubcategories = [
  'shirt',
  'blouse',
  'tshirt',
  'sweater',
  'cardigan',
  'hoodie',
  'crop-top',
  'tank-top',
  'polo',
  'thermal',
  'jeans',
  'pants',
  'chinos',
  'shorts',
  'skirt',
  'leggings',
  'joggers',
  'cargo',
  'dress-pants',
  'casual-dress',
  'cocktail-dress',
  'evening-dress',
  'maxi-dress',
  'mini-dress',
  'shirt-dress',
  'wrap-dress',
  'jacket',
  'coat',
  'blazer',
  'puffer',
  'trench',
  'leather-jacket',
  'denim-jacket',
  'windbreaker',
  'sneakers',
  'heels',
  'flats',
  'boots',
  'loafers',
  'sandals',
  'flip-flops',
  'slippers',
  'wedges',
  'scarf',
  'hat',
  'belt',
  'gloves',
  'bag',
  'backpack',
  'watch',
  'jewelry',
  'sunglasses',
  'yoga-pants',
  'gym-shirt',
  'sports-bra',
  'running-shoes',
  'workout-shorts',
  'athletic-tights',
  'pajamas',
  'nightgown',
  'nightshirt',
  'sleep-shorts',
  'bra',
  'underwear',
  'socks',
  'stockings',
  'shapewear',
] as const

const colours = [
  'white',
  'black',
  'gray',
  'red',
  'pink',
  'magenta',
  'purple',
  'blue',
  'navy',
  'cyan',
  'teal',
  'green',
  'olive',
  'yellow',
  'gold',
  'orange',
  'brown',
  'tan',
  'beige',
  'cream',
] as const

const materials = [
  'cotton',
  'polyester',
  'wool',
  'silk',
  'linen',
  'denim',
  'leather',
  'suede',
  'nylon',
  'spandex',
  'rayon',
  'cashmere',
  'blend',
  'knit',
  'mesh',
  'fleece',
] as const

const seasons = ['spring', 'summer', 'fall', 'winter', 'all-season'] as const
const styles = [
  'casual',
  'formal',
  'business',
  'sporty',
  'bohemian',
  'minimalist',
  'vintage',
  'trendy',
  'preppy',
  'edgy',
  'romantic',
  'athletic',
  'classic',
] as const
const occasions = [
  'everyday',
  'work',
  'business-meeting',
  'casual-date',
  'formal-date',
  'party',
  'wedding',
  'gym',
  'outdoor-activity',
  'beach',
  'sleep',
  'lounge',
  'travel',
  'interview',
] as const
const fits = ['extra-slim', 'slim', 'regular', 'relaxed', 'oversized', 'fitted', 'loose'] as const
const warmthLevels = ['very-cool', 'cool', 'neutral', 'warm', 'very-warm'] as const

const scanRequestSchema = z.object({
  imageDataUrl: z.string().startsWith('data:image/').max(12_000_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  backgroundRemoval: z.boolean().optional().default(false),
})

const aiClothingMetadataSchema = z.object({
  category: z.enum(clothingCategories),
  subcategory: z.enum(clothingSubcategories),
  primaryColor: z.enum(colours),
  secondaryColor: z.enum(colours).nullable(),
  material: z.enum(materials),
  season: z.enum(seasons),
  style: z.enum(styles),
  occasion: z.enum(occasions),
  fit: z.enum(fits),
  warmthLevel: z.enum(warmthLevels),
  confidenceScore: z.number().min(0).max(1),
  generatedTags: z.array(z.string().min(1).max(40)).min(1).max(12),
  notes: z.string().max(240),
  warnings: z.array(z.string().max(120)).max(5),
})

type AiClothingMetadata = z.infer<typeof aiClothingMetadataSchema>

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Vary': 'Origin',
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

interface WearLog {
  id?: number
  dk_itemid: number
  worn_date: string
  outfit_id?: number | null
  notes?: string | null
}

interface Outfit {
  pk_outfitid?: number
  outfitname: string
  occasion?: string | null
  season?: string | null
  notes?: string | null
  styles?: string[] | null
  seasons?: string[] | null
  occasions?: string[] | null
  favorite?: boolean | null
}

interface OutfitItem {
  pk_outfititemid?: number
  dk_outfitid: number
  dk_itemid: number
  slot?: string | null
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
  wearlog:      { table: 'wearlog',      pk: 'id'               },
  season:       { table: 'season',       pk: 'pk_seasonid'      },
  occasion:     { table: 'occasion',     pk: 'pk_occasionid'    },
  itemtag:      { table: 'itemtag',      pk: 'pk_itemtagid'     },
  customtag:    { table: 'customtag',    pk: 'pk_customtagid'   },
  outfit:       { table: 'outfit',       pk: 'pk_outfitid'      },
  outfititem:   { table: 'outfititem',   pk: 'pk_outfititemid'  },
  itemphoto:    { table: 'itemphoto',    pk: 'pk_itemphotoid'   },
}

// Query params that are allowed as filters per table (foreign key columns)
const ALLOWED_FILTERS: Record<string, string[]> = {
  for_location: ['dk_styleid'],
  info:         ['dk_itemid', 'dk_styleid', 'dk_colourid', 'dk_material'],
  item:         ['dk_closet'],
  storage:      ['dk_homelocation'],
  wash:         ['dk_itemid'],
  wearlog:      ['dk_itemid', 'outfit_id'],
  itemtag:      ['dk_itemid', 'dk_seasonid', 'dk_styleid', 'dk_occasionid'],
  customtag:    ['dk_itemid'],
  outfititem:   ['dk_outfitid', 'dk_itemid', 'slot'],
  itemphoto:    ['dk_itemid', 'is_primary'],
}

// Tables that expose a joined select (Supabase PostgREST syntax)
const JOINED_SELECT: Record<string, string> = {
  info: '*, colour(*), style(*), item(*), material(*)',
  item: '*, storage(*)',
  wash: '*, item(*)',
  wearlog: '*, item(*)',
  for_location: '*, style(*)',
  storage: '*, home(*)',
  itemtag: '*, season(*), style(*), occasion(*)',
  outfititem: '*, item(*)',
  itemphoto: '*',
}

// --- Generic CRUD helpers

function json(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return String(error)
}

function getClientKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'anonymous'
}

function enforceScanRateLimit(req: Request): void {
  const key = getClientKey(req)
  const now = Date.now()
  const current = scanRateLimits.get(key)

  if (!current || current.resetAt <= now) {
    scanRateLimits.set(key, { count: 1, resetAt: now + SCAN_WINDOW_MS })
    return
  }

  if (current.count >= SCAN_LIMIT) {
    throw new Error('AI scan rate limit reached. Please wait a minute and try again.')
  }

  scanRateLimits.set(key, { ...current, count: current.count + 1 })
}

const scanJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'category',
    'subcategory',
    'primaryColor',
    'secondaryColor',
    'material',
    'season',
    'style',
    'occasion',
    'fit',
    'warmthLevel',
    'confidenceScore',
    'generatedTags',
    'notes',
    'warnings',
  ],
  properties: {
    category: { type: 'string', enum: clothingCategories },
    subcategory: { type: 'string', enum: clothingSubcategories },
    primaryColor: { type: 'string', enum: colours },
    secondaryColor: { anyOf: [{ type: 'string', enum: colours }, { type: 'null' }] },
    material: { type: 'string', enum: materials },
    season: { type: 'string', enum: seasons },
    style: { type: 'string', enum: styles },
    occasion: { type: 'string', enum: occasions },
    fit: { type: 'string', enum: fits },
    warmthLevel: { type: 'string', enum: warmthLevels },
    confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
    generatedTags: {
      type: 'array',
      minItems: 1,
      maxItems: 12,
      items: { type: 'string' },
    },
    notes: { type: 'string' },
    warnings: {
      type: 'array',
      maxItems: 5,
      items: { type: 'string' },
    },
  },
} as const

function extractResponseText(responseBody: Record<string, unknown>): string {
  if (typeof responseBody.output_text === 'string') return responseBody.output_text

  const output = Array.isArray(responseBody.output) ? responseBody.output : []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : []
    for (const part of content) {
      if (!part || typeof part !== 'object') continue
      const text = (part as { text?: unknown }).text
      if (typeof text === 'string') return text
    }
  }

  throw new Error('AI response did not include structured text output.')
}

async function analyzeClothingImage(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  enforceScanRateLimit(req)

  const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiApiKey) {
    return json(
      {
        error: 'AI scanning is not configured. Add OPENAI_API_KEY to the Supabase function environment.',
        fallback: 'manual-entry',
      },
      corsHeaders,
      503,
    )
  }

  const requestBody = scanRequestSchema.parse(await req.json())
  const model = Deno.env.get('OPENAI_VISION_MODEL') || 'gpt-4.1-mini'
  const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'Analyze a single clothing item image for a closet inventory app.',
                'Return only visible or strongly inferable wardrobe metadata.',
                'Prefer conservative, normalized enum values over guesses.',
                'If the image is unclear, lower confidence and add a warning.',
              ].join(' '),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Extract metadata. Background removal requested: ${requestBody.backgroundRemoval ? 'yes' : 'no'}.`,
            },
            {
              type: 'input_image',
              image_url: requestBody.imageDataUrl,
              detail: 'high',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'clothing_scan',
          strict: true,
          schema: scanJsonSchema,
        },
      },
    }),
  })

  if (!openAiResponse.ok) {
    const errorBody = await openAiResponse.text()
    console.error('[AI scan] OpenAI error', openAiResponse.status, errorBody)
    return json(
      {
        error: openAiResponse.status === 429
          ? 'AI scanning is temporarily rate limited. Please try again soon.'
          : 'AI scanning failed. You can retry or enter details manually.',
        fallback: 'manual-entry',
      },
      corsHeaders,
      openAiResponse.status === 429 ? 429 : 502,
    )
  }

  const responseBody = await openAiResponse.json() as Record<string, unknown>
  const refusal = JSON.stringify(responseBody).includes('"refusal"')
  if (refusal) {
    return json(
      {
        error: 'AI scanning declined this image. Please retry with a clearer clothing photo or enter details manually.',
        fallback: 'manual-entry',
      },
      corsHeaders,
      422,
    )
  }

  const parsed = JSON.parse(extractResponseText(responseBody))
  const metadata: AiClothingMetadata = aiClothingMetadataSchema.parse(parsed)

  return json({ data: metadata }, corsHeaders)
}

function resolveResource(pathname: string): { resource: string; resourceId: string | null } {
  const pathParts = pathname.split('/').filter(Boolean)
  const tableIdx = pathParts.findIndex((part, index) => {
    if (!TABLE_CONFIG[part]) return false
    const next = pathParts[index + 1]
    return !next || !TABLE_CONFIG[next]
  })

  const resource = tableIdx !== -1 ? pathParts[tableIdx] : ''
  const nextSegment = tableIdx !== -1 ? pathParts[tableIdx + 1] : undefined
  const resourceId = nextSegment && !TABLE_CONFIG[nextSegment] ? nextSegment : null

  return { resource, resourceId }
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const urlObj = new URL(url)
    const searchParams = urlObj.searchParams

    if (urlObj.pathname.endsWith('/ai/scan')) {
      if (method !== 'POST') return json({ error: 'Method not allowed' }, corsHeaders, 405)
      return analyzeClothingImage(req, corsHeaders)
    }

    const { resource, resourceId } = resolveResource(urlObj.pathname)

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

    return new Response(JSON.stringify({ error: errorToMessage(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
