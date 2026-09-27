create table if not exists props (
  id serial primary key,
  name text not null,
  category text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so the standard-prop-list seed script can
-- upsert safely (re-running it after a manually-added "Tank Trap" must not
-- create a duplicate "tank trap" row).
create unique index if not exists props_name_unique on props (lower(name));

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

-- Mirrors the real nrl22.com REST API response shape
-- (wp-json/nrl22/v1/match-results), discovered live rather than guessed.
-- Unique key is the natural key of one shooter's result row for one match;
-- re-scraping is a plain upsert, never a duplicate insert.
create table if not exists results (
  id serial primary key,
  source text not null default 'nrl22',
  match_date date not null,
  season text,
  match_type text,
  club_name text,
  shooter_name text,
  class text,
  division text,
  shooter_id text,
  raw_score numeric,
  overall_finish integer,
  division_finish integer,
  class_finish integer,
  leaderboard_points numeric,
  scraped_at timestamptz not null default now(),
  unique (source, match_date, match_type, shooter_id, division)
);
