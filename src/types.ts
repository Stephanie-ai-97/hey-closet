
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

export type TableName = 'home' | 'storage' | 'item' | 'colour' | 'material' | 'style' | 'info' | 'wash' | 'for_location';
