-- اخبارك - Supabase setup
create extension if not exists pgcrypto;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  excerpt text not null default '',
  image_url text not null default '',
  category text not null check (category in ('سياسة','اقتصاد','رياضة','تكنولوجيا','ثقافة')),
  published_at timestamptz not null default now(),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists news_published_at_idx on public.news (published_at desc);
create index if not exists news_category_idx on public.news (category);
create index if not exists news_featured_idx on public.news (featured);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.news enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read news" on public.news;
create policy "Public can read news" on public.news
for select to anon, authenticated
using (true);

drop policy if exists "Admins can insert news" on public.news;
create policy "Admins can insert news" on public.news
for insert to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update news" on public.news;
create policy "Admins can update news" on public.news
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete news" on public.news;
create policy "Admins can delete news" on public.news
for delete to authenticated
using (public.is_admin());

drop policy if exists "Admins can read admin list" on public.admin_users;
create policy "Admins can read admin list" on public.admin_users
for select to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view news images" on storage.objects;
create policy "Public can view news images" on storage.objects
for select to public
using (bucket_id = 'news-images');

drop policy if exists "Admins can upload news images" on storage.objects;
create policy "Admins can upload news images" on storage.objects
for insert to authenticated
with check (bucket_id = 'news-images' and public.is_admin());

drop policy if exists "Admins can update news images" on storage.objects;
create policy "Admins can update news images" on storage.objects
for update to authenticated
using (bucket_id = 'news-images' and public.is_admin())
with check (bucket_id = 'news-images' and public.is_admin());

drop policy if exists "Admins can delete news images" on storage.objects;
create policy "Admins can delete news images" on storage.objects
for delete to authenticated
using (bucket_id = 'news-images' and public.is_admin());

-- بعد إنشاء مستخدم المدير من Authentication > Users، نفّذ:
-- insert into public.admin_users (user_id) values ('UUID_OF_ADMIN_USER');
