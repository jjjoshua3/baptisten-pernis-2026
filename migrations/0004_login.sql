-- Inloglink en authenticator voor het beheer. Los van andere projecten in dezelfde database.

create table if not exists login_link (
  id text primary key,
  email text not null,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists login_session (
  token_hash text primary key,
  email text not null,
  totp_ok boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists login_totp (
  email text primary key,
  secret text not null,
  enabled boolean not null default false,
  login_count integer not null default 0,
  last_verified_at timestamptz
);

create index if not exists login_link_email_idx on login_link (email, created_at desc);

insert into staff (user_id, email, display_name, role, can_agenda, can_content, can_users, can_audit)
select 'aa0271n8@gmail.com', 'aa0271n8@gmail.com', 'Joshua', 'eigenaar', true, true, true, true
where not exists (select 1 from staff where lower(email) = 'aa0271n8@gmail.com');
