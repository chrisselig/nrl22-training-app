create table if not exists props (
  id serial primary key,
  name text not null,
  category text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists strategies (
  id serial primary key,
  prop_id integer not null references props(id) on delete cascade,
  position text not null,
  equipment text,
  bag_placement text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prop_id, position)
);

-- No uniqueness constraint on (match_date, stage_name): the same month's
-- stage set can be shot more than once (e.g. two October 2026 matches), and
-- every attempt must insert as its own row rather than overwrite the last.
create table if not exists stage_logs (
  id serial primary key,
  match_date date not null,
  match_name text,
  stage_name text,
  prop_id integer references props(id) on delete set null,
  prop_name_freeform text,
  position text,
  impacts integer,
  shots_possible integer,
  time_seconds numeric,
  comments text,
  created_at timestamptz not null default now()
);

-- Migration note: if stage_logs already existed with the old default
-- (on delete no action), fix the constraint in place rather than
-- dropping/recreating the table, since it may already hold real match data.
alter table stage_logs drop constraint if exists stage_logs_prop_id_fkey;
alter table stage_logs
  add constraint stage_logs_prop_id_fkey
  foreign key (prop_id) references props(id) on delete set null;
