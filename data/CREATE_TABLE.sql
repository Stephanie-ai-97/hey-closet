create table public.colour (
  pk_colourid integer generated always as identity not null,
  colouroverall character varying(100) null,
  majorcolour character varying(100) null,
  minorcolour character varying(100) null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint colour_pkey primary key (pk_colourid)
) TABLESPACE pg_default;

create trigger trg_colour_updated BEFORE
update on colour for EACH row
execute FUNCTION update_updated_at_column ();

create table public.for_location (
  pk_forlocationid integer generated always as identity not null,
  dk_styleid integer not null,
  forlocationaddress character varying(200) null,
  forlocationtype character varying(100) null,
  isforlocationindoor boolean null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint for_location_pkey primary key (pk_forlocationid),
  constraint fk_forlocation_style foreign KEY (dk_styleid) references style (pk_styleid)
) TABLESPACE pg_default;

create index IF not exists idx_forlocation_style on public.for_location using btree (dk_styleid) TABLESPACE pg_default;

create trigger trg_forlocation_updated BEFORE
update on for_location for EACH row
execute FUNCTION update_updated_at_column ();

create table public.home (
  pk_homelocation integer generated always as identity not null,
  homename character varying(100) null,
  homeaddress character varying(200) null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint home_pkey primary key (pk_homelocation)
) TABLESPACE pg_default;

create trigger trg_home_updated BEFORE
update on home for EACH row
execute FUNCTION update_updated_at_column ();

create table public.info (
  pk_infoid integer generated always as identity not null,
  dk_itemid integer not null,
  dk_styleid integer not null,
  dk_colourid integer not null,
  dk_material integer not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint info_pkey primary key (pk_infoid),
  constraint uq_info unique (dk_itemid, dk_styleid, dk_colourid, dk_material),
  constraint fk_info_colour foreign KEY (dk_colourid) references colour (pk_colourid),
  constraint fk_info_item foreign KEY (dk_itemid) references item (pk_itemid) on delete CASCADE,
  constraint fk_info_material foreign KEY (dk_material) references material (pk_material),
  constraint fk_info_style foreign KEY (dk_styleid) references style (pk_styleid)
) TABLESPACE pg_default;

create index IF not exists idx_info_item on public.info using btree (dk_itemid) TABLESPACE pg_default;

create index IF not exists idx_info_style on public.info using btree (dk_styleid) TABLESPACE pg_default;

create index IF not exists idx_info_colour on public.info using btree (dk_colourid) TABLESPACE pg_default;

create index IF not exists idx_info_material on public.info using btree (dk_material) TABLESPACE pg_default;

create trigger trg_info_updated BEFORE
update on info for EACH row
execute FUNCTION update_updated_at_column ();


create table public.item (
  pk_itemid integer generated always as identity not null,
  dk_closet integer not null,
  itemtype character varying(100) not null,
  itemsize character varying(50) null,
  isoncamera boolean null,
  itemlikerating smallint null,
  itemcost numeric(10, 2) null,
  itemcomment character varying(500) null,
  itemwashmethod character varying(100) null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint item_pkey primary key (pk_itemid),
  constraint fk_item_storage foreign KEY (dk_closet) references storage (pk_closet),
  constraint item_itemcost_check check ((itemcost >= (0)::numeric)),
  constraint item_itemlikerating_check check (
    (
      (itemlikerating >= 1)
      and (itemlikerating <= 10)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_item_closet on public.item using btree (dk_closet) TABLESPACE pg_default;

create trigger trg_item_updated BEFORE
update on item for EACH row
execute FUNCTION update_updated_at_column ();


create table public.material (
  pk_material integer generated always as identity not null,
  texture character varying(100) null,
  softness character varying(100) null,
  thickness character varying(100) null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint material_pkey primary key (pk_material)
) TABLESPACE pg_default;

create trigger trg_material_updated BEFORE
update on material for EACH row
execute FUNCTION update_updated_at_column ();

create table public.material (
  pk_material integer generated always as identity not null,
  texture character varying(100) null,
  softness character varying(100) null,
  thickness character varying(100) null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint material_pkey primary key (pk_material)
) TABLESPACE pg_default;

create trigger trg_material_updated BEFORE
update on material for EACH row
execute FUNCTION update_updated_at_column ();

create table public.style (
  pk_styleid integer generated always as identity not null,
  styletype character varying(100) null,
  styleyear smallint null,
  stylefitsize character varying(50) null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint style_pkey primary key (pk_styleid)
) TABLESPACE pg_default;

create trigger trg_style_updated BEFORE
update on style for EACH row
execute FUNCTION update_updated_at_column ();


create table public.wash (
  pk_wash integer generated always as identity not null,
  dk_itemid integer not null,
  lastwashdate date null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint wash_pkey primary key (pk_wash),
  constraint fk_wash_item foreign KEY (dk_itemid) references item (pk_itemid) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_wash_item on public.wash using btree (dk_itemid) TABLESPACE pg_default;

create trigger trg_wash_updated BEFORE
update on wash for EACH row
execute FUNCTION update_updated_at_column ();