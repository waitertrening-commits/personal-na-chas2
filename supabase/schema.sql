-- Схема для портала "Персонал на час". Выполнить целиком в Supabase → SQL Editor → Run.
create table if not exists profiles(id uuid primary key references auth.users(id) on delete cascade, email text, full_name text, role text not null default 'user', created_at timestamptz default now());
create table if not exists vacancies(id uuid primary key default gen_random_uuid(), created_by uuid references auth.users(id) on delete set null, title text not null, company text, city text, salary text, type text, phone text, description text, status text not null default 'pending', created_at timestamptz default now());
create table if not exists resumes(id uuid primary key default gen_random_uuid(), user_id uuid unique references auth.users(id) on delete cascade, full_name text not null, phone text, position text, city text, experience text, salary text, about text, status text not null default 'pending', created_at timestamptz default now());
create table if not exists applications(id uuid primary key default gen_random_uuid(), vacancy_id uuid references vacancies(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade, name text, phone text, message text, vacancy_title text, created_at timestamptz default now(), unique(vacancy_id,user_id));
create table if not exists orders(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null, name text, phone text, event_date text, event text, address text, staff text, guests text, budget text, comment text, status text not null default 'new', created_at timestamptz default now());

create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;

-- Профиль создаётся автоматически. Админ назначается ТОЛЬКО для подтверждённого email.
create or replace function handle_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,full_name,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),
    case when lower(new.email)='waiter.trening@gmail.com' and new.email_confirmed_at is not null then 'admin' else 'user' end)
  on conflict(id) do update set role=excluded.role where excluded.role='admin';
  return new;
end $$;
drop trigger if exists on_auth_user on auth.users;
create trigger on_auth_user after insert or update of email_confirmed_at on auth.users for each row execute function handle_user();
-- Если админ уже входил раньше, создаём профили задним числом:
insert into profiles(id,email,full_name,role) select id,email,coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',split_part(email,'@',1)),case when lower(email)='waiter.trening@gmail.com' and email_confirmed_at is not null then 'admin' else 'user' end from auth.users on conflict(id) do update set role=excluded.role where excluded.role='admin';

alter table profiles enable row level security; alter table vacancies enable row level security; alter table resumes enable row level security; alter table applications enable row level security; alter table orders enable row level security;

create policy "profiles read" on profiles for select using (id=auth.uid() or is_admin());

create policy "vac read" on vacancies for select using (status='published' or created_by=auth.uid() or is_admin());
create policy "vac insert" on vacancies for insert with check ((created_by=auth.uid() and status<>'published') or is_admin());
create policy "vac update" on vacancies for update using (created_by=auth.uid() or is_admin()) with check ((created_by=auth.uid() and status<>'published') or is_admin());
create policy "vac delete" on vacancies for delete using (created_by=auth.uid() or is_admin());

create policy "res read" on resumes for select using ((status='published' and auth.uid() is not null) or user_id=auth.uid() or is_admin());
create policy "res insert" on resumes for insert with check ((user_id=auth.uid() and status<>'published') or is_admin());
create policy "res update" on resumes for update using (user_id=auth.uid() or is_admin()) with check ((user_id=auth.uid() and status<>'published') or is_admin());
create policy "res delete" on resumes for delete using (user_id=auth.uid() or is_admin());

create policy "app read" on applications for select using (user_id=auth.uid() or is_admin() or exists(select 1 from vacancies v where v.id=vacancy_id and v.created_by=auth.uid()));
create policy "app insert" on applications for insert with check (user_id=auth.uid() and exists(select 1 from vacancies v where v.id=vacancy_id and v.status='published' and v.created_by is distinct from auth.uid()));
create policy "app delete" on applications for delete using (user_id=auth.uid() or is_admin());

create policy "ord insert" on orders for insert with check (user_id is null or user_id=auth.uid());
create policy "ord read" on orders for select using (user_id=auth.uid() or is_admin());
create policy "ord update" on orders for update using (is_admin());
create policy "ord delete" on orders for delete using (is_admin());

-- Ограничения: допустимые статусы и длины полей (защита от мусора и спама).
alter table vacancies add constraint vac_ok check (status in ('pending','published','hidden') and char_length(title)<=200 and char_length(coalesce(company,''))<=200 and char_length(coalesce(city,''))<=200 and char_length(coalesce(salary,''))<=200 and char_length(coalesce(type,''))<=200 and char_length(coalesce(phone,''))<=200 and char_length(coalesce(description,''))<=3000);
alter table resumes add constraint res_ok check (status in ('pending','published','hidden') and char_length(full_name)<=200 and char_length(coalesce(phone,''))<=200 and char_length(coalesce(position,''))<=200 and char_length(coalesce(city,''))<=200 and char_length(coalesce(experience,''))<=200 and char_length(coalesce(salary,''))<=200 and char_length(coalesce(about,''))<=3000);
alter table applications add constraint app_ok check (char_length(coalesce(name,''))<=200 and char_length(coalesce(phone,''))<=200 and char_length(coalesce(message,''))<=200 and char_length(coalesce(vacancy_title,''))<=200);
alter table orders add constraint ord_ok check (status in ('new','work','done') and char_length(coalesce(name,''))<=200 and char_length(coalesce(phone,''))<=200 and char_length(coalesce(event_date,''))<=200 and char_length(coalesce(event,''))<=200 and char_length(coalesce(address,''))<=200 and char_length(coalesce(staff,''))<=200 and char_length(coalesce(guests,''))<=200 and char_length(coalesce(budget,''))<=200 and char_length(coalesce(comment,''))<=3000);
