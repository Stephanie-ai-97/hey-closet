
export interface Home {
  id: number;
  homename: string;
  homeaddress: string;
}

export interface Storage {
  id: number;
  closet: string;
  closetpartition: string;
  hasstoragecover: boolean;
  dk_homelocation: number;
}

export interface Item {
  id: number;
  dk_closet: number;
  itemtype: string;
  itemsize: string;
  isoncamera: boolean;
  itemlikerating: number;
  itemcost: number;
  itemcomment: string;
  itemwashmethod: string;
  wash_status: 'clean' | 'washing' | 'drying' | 'dirty';
  in_temp: boolean;
  // Derived fields exposed by item_with_tags or enriched client-side data.
  // These are not stored on the base item table.
  category?: string;
  subcategory?: string;
  primary_color?: string;
  secondary_color?: string;
  brand?: string;
  warmth_level?: string;
  fit?: string;
  created_at?: string;
  updated_at?: string;
  seasons?: string[];
  styles?: string[];
  occasions?: string[];
  photo_url?: string;
}

// ============= TAG SYSTEM INTERFACES =============

export interface Season {
  id: number;
  season_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Style {
  id: number;
  styletype: string;
  styleyear?: number;
  stylefitsize?: string;
  /** @deprecated Use styletype. Kept optional for older view/API payloads. */
  style_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Occasion {
  id: number;
  occasion_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemTag {
  id: number;
  dk_itemid: number;
  dk_seasonid?: number;
  dk_styleid?: number;
  dk_occasionid?: number;
  tag_source: 'system' | 'user' | 'ai';
  created_at?: string;
  updated_at?: string;
}

export interface CustomTag {
  id: number;
  dk_itemid: number;
  tag_name: string;
  tag_category: 'user_defined' | 'ai_generated';
  created_at?: string;
  updated_at?: string;
}

export interface Material {
  id: number;
  texture: string;
  softness: string;
  thickness: string;
}

export interface Colour {
  id: number;
  colouroverall: string;
  majorcolour: string;
  minorcolour: string;
}

export interface Info {
  id: number;
  dk_itemid: number;
  dk_styleid: number;
  dk_colourid: number;
  dk_material: number;
  tag_source: 'system' | 'user';
}

export interface Wash {
  id: number;
  dk_itemid: number;
  lastwashdate: string;
  created_at?: string;
  updated_at?: string;
}

export interface ForLocation {
  id: number;
  dk_styleid: number;
  forlocationaddress: string;
  forlocationtype: string;
  isforlocationindoor: boolean;
}

export interface WearLog {
  id: number;
  dk_itemid: number;
  worn_date: string;
  outfit_id?: number;
  notes?: string;
}

export interface Outfit {
  id: number;
  outfitname: string;
  occasion?: string;
  season?: string;
  notes?: string;
  styles?: string[];
  seasons?: string[];
  occasions?: string[];
  favorite?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface OutfitItem {
  id: number;
  dk_outfitid: number;
  dk_itemid: number;
  slot?: OutfitSlot;
}

export type OutfitSlot = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessories';

export interface OutfitSelection {
  top?: Item;
  bottom?: Item;
  shoes?: Item;
  outerwear?: Item;
  accessories?: Item[];
}

export interface ItemPhoto {
  id: number;
  dk_itemid: number;
  storage_path: string;
  is_primary: boolean;
  caption?: string;
  created_at?: string;
}

export interface Weather {
  city: string;
  temperature: number;
  condition: string;
  icon: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export type TableName = 'home' | 'storage' | 'item' | 'colour' | 'material' | 'style' | 'season' | 'occasion' | 'itemtag' | 'customtag' | 'info' | 'wash' | 'for_location' | 'wearlog' | 'outfit' | 'outfititem' | 'itemphoto';
