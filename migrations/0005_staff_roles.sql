-- Ontwikkelaar naast eigenaar, plus de vaste inlogadressen van dit project.

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'staff'::regclass and contype = 'c'
  loop
    execute format('alter table staff drop constraint %I', r.conname);
  end loop;
end $$;

alter table staff add constraint staff_role_check
  check (role in ('eigenaar', 'ontwikkelaar', 'beheerder', 'medewerker'));

insert into staff (user_id, email, display_name, role, can_agenda, can_content, can_users, can_audit)
select 'joshua.bosma@kpnmail.nl', 'joshua.bosma@kpnmail.nl', 'Joshua Bosma', 'ontwikkelaar', true, true, true, true
where not exists (select 1 from staff where lower(email) = 'joshua.bosma@kpnmail.nl');

insert into staff (user_id, email, display_name, role, can_agenda, can_content, can_users, can_audit)
select 'dcl@baptistenpernis.nl', 'dcl@baptistenpernis.nl', 'Dennis Corporaal', 'eigenaar', true, true, true, true
where not exists (select 1 from staff where lower(email) = 'dcl@baptistenpernis.nl');
