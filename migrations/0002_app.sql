create table routines (
  id text not null primary key,
  user_id text not null references "user" ("id") on delete cascade,
  name text not null,
  day_tags text not null default '{}',
  is_active integer not null default 0,
  sort_order integer not null default 0,
  created_at integer not null
);

create index routines_user_idx on routines (user_id);
-- at most one active routine per user
create unique index routines_one_active_idx on routines (user_id) where is_active = 1;

create table categories (
  id text not null primary key,
  routine_id text not null references routines (id) on delete cascade,
  name text not null,
  color text not null,
  sort_order integer not null default 0
);

create index categories_routine_idx on categories (routine_id);

create table blocks (
  id text not null primary key,
  routine_id text not null references routines (id) on delete cascade,
  day_of_week integer not null,
  category_id text references categories (id) on delete set null,
  title text not null,
  detail text not null default '',
  room text not null default '',
  start_min integer not null,
  end_min integer not null,
  sort_order integer not null default 0
);

create index blocks_routine_idx on blocks (routine_id, day_of_week);
