
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
  created_at?: string;
}

export interface Colour {
  id: number;
  colouroverall: string;
  colourinner: string;
  colourouter: string;
}

export interface Material {
  id: number;
  texture: string;
  softness: string;
  thickness: string;
}

export interface Style {
  id: number;
  styletype: string;
  styleyear: number;
  stylefitsize: string;
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
  occasion: string;
  season: string;
  notes?: string;
  created_at?: string;
}

export interface OutfitItem {
  id: number;
  dk_outfitid: number;
  dk_itemid: number;
}

export interface ItemPhoto {
  id: number;
  dk_itemid: number;
  storage_path: string;
  is_primary: boolean;
  caption?: string;
  created_at?: string;
}

export type TableName = 'home' | 'storage' | 'item' | 'colour' | 'material' | 'style' | 'info' | 'wash' | 'for_location' | 'wearlog' | 'outfit' | 'outfititem' | 'itemphoto';
