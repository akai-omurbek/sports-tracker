-- Run this in the Supabase SQL Editor to set up the database

-- Activities
create table if not exists activities (
  id          text primary key,
  type        text not null,
  name        text not null,
  date        text not null,
  time        text default '',
  duration    text default '',
  sets        text default '',
  reps        text default '',
  weight      text default '',
  notes       text default '',
  source      text default 'manual',
  created_at  timestamptz default now()
);

-- Exercises
create table if not exists exercises (
  id           text primary key,
  name         text not null,
  category     text default 'Other',
  instructions text default ''
);

-- Seed default exercises (skip if already present)
insert into exercises (id, name, category) values
  ('bench-press',       'Bench Press',        'Push'),
  ('overhead-press',    'Overhead Press',      'Push'),
  ('incline-bench',     'Incline Bench Press', 'Push'),
  ('push-ups',          'Push-ups',            'Push'),
  ('dips',              'Dips',                'Push'),
  ('pull-ups',          'Pull-ups',            'Pull'),
  ('chin-ups',          'Chin-ups',            'Pull'),
  ('barbell-row',       'Barbell Row',         'Pull'),
  ('dumbbell-row',      'Dumbbell Row',        'Pull'),
  ('lat-pulldown',      'Lat Pulldown',        'Pull'),
  ('face-pull',         'Face Pull',           'Pull'),
  ('squat',             'Squat',               'Legs'),
  ('deadlift',          'Deadlift',            'Legs'),
  ('rdl',               'Romanian Deadlift',   'Legs'),
  ('leg-press',         'Leg Press',           'Legs'),
  ('lunges',            'Lunges',              'Legs'),
  ('hip-thrust',        'Hip Thrust',          'Legs'),
  ('calf-raises',       'Calf Raises',         'Legs'),
  ('bicep-curl',        'Bicep Curl',          'Arms'),
  ('hammer-curl',       'Hammer Curl',         'Arms'),
  ('tricep-pushdown',   'Tricep Pushdown',     'Arms'),
  ('skull-crusher',     'Skull Crusher',       'Arms'),
  ('plank',             'Plank',               'Core'),
  ('ab-wheel',          'Ab Wheel',            'Core'),
  ('hanging-leg-raise', 'Hanging Leg Raise',   'Core')
on conflict (id) do nothing;

-- Templates
create table if not exists templates (
  id          text primary key,
  name        text not null,
  description text default '',
  exercises   jsonb default '[]'::jsonb
);

-- Checkpoints (progress photos)
create table if not exists checkpoints (
  id               text primary key,
  date             text not null,
  photo            text not null,
  _photo_filename  text default '',
  weight           text default '',
  body_fat         text default '',
  chest            text default '',
  waist            text default '',
  hips             text default '',
  arms             text default '',
  notes            text default '',
  created_at       timestamptz default now()
);

-- Profile (single row)
create table if not exists profile (
  id     int primary key default 1,
  height text default ''
);
insert into profile (id) values (1) on conflict do nothing;

-- Disable RLS on all tables (personal app, no multi-user auth)
alter table activities  disable row level security;
alter table exercises   disable row level security;
alter table templates   disable row level security;
alter table checkpoints disable row level security;
alter table profile     disable row level security;
