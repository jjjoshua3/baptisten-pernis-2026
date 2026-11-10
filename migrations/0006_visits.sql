create table if not exists page_view (
  id serial primary key,
  viewed_on date not null default current_date,
  visitor_key text not null,
  path text not null,
  country text not null default '',
  city text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists page_view_day_idx on page_view (viewed_on desc);
