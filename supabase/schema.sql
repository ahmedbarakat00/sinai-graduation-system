-- Sinai Graduation Project Management System
-- Apply in Supabase SQL Editor only after reviewing the policies.
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'doctor');
create type public.project_status as enum ('pending', 'accepted', 'rejected', 'closed');
create type public.review_status as enum ('pending', 'accepted', 'rejected', 'superseded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name_ar text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  description_ar text not null,
  description_en text not null,
  status public.project_status not null default 'pending',
  final_doctor_id uuid references public.doctors(id) on delete restrict,
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'accepted') or final_doctor_id is not null),
  check ((status <> 'closed') or closed_reason is not null)
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  full_name text not null,
  university_id text not null,
  is_leader boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, university_id)
);

create unique index one_leader_per_project on public.project_members(project_id) where is_leader;

create table public.review_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  status public.review_status not null default 'pending',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  superseded_by uuid references public.review_requests(id) on delete set null
);

create unique index one_pending_review_per_project on public.review_requests(project_id) where status = 'pending';

create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  review_request_id uuid not null unique references public.review_requests(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  decision public.review_status not null check (decision in ('accepted','rejected')),
  reason text,
  created_at timestamptz not null default now(),
  check ((decision <> 'rejected') or (reason is not null and length(trim(reason)) > 0))
);

create table public.system_settings (
  id boolean primary key default true check (id),
  submissions_open boolean not null default true,
  min_team_size integer not null default 1 check (min_team_size >= 1),
  max_team_size integer not null default 5 check (max_team_size >= min_team_size),
  academic_year text not null default '2026–2027',
  updated_at timestamptz not null default now()
);
insert into public.system_settings(id) values (true) on conflict do nothing;

create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.current_doctor_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select d.id from public.doctors d
  join public.profiles p on p.id = d.profile_id
  where p.id = (select auth.uid()) and d.is_active = true
$$;

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.review_requests enable row level security;
alter table public.review_decisions enable row level security;
alter table public.system_settings enable row level security;

create policy "profiles read self or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.current_role() = 'admin');

create policy "doctors list active for public form" on public.doctors for select to anon, authenticated
using (is_active = true);

create policy "doctors admin manage" on public.doctors for all to authenticated
using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "projects doctor assigned or admin read" on public.projects for select to authenticated
using (
  public.current_role() = 'admin'
  or exists (
    select 1 from public.review_requests rr
    where rr.project_id = projects.id and rr.doctor_id = public.current_doctor_id()
  )
);

create policy "members doctor assigned or admin read" on public.project_members for select to authenticated
using (
  public.current_role() = 'admin'
  or exists (
    select 1 from public.review_requests rr
    where rr.project_id = project_members.project_id and rr.doctor_id = public.current_doctor_id()
  )
);

create policy "review requests assigned doctor or admin read" on public.review_requests for select to authenticated
using (public.current_role() = 'admin' or doctor_id = public.current_doctor_id());

create policy "decisions assigned doctor or admin read" on public.review_decisions for select to authenticated
using (public.current_role() = 'admin' or doctor_id = public.current_doctor_id());

create policy "settings read" on public.system_settings for select to anon, authenticated using (true);
create policy "settings admin update" on public.system_settings for update to authenticated
using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- NOTE:
-- Do not enable public INSERT/UPDATE policies on projects, members, reviews, or decisions.
-- Implement submission/review/reassignment/closure as carefully validated SECURITY DEFINER
-- RPC functions after reviewing this schema. The frontend calls submit_project(), which must
-- be created and tested before public submissions will work.
-- Provision the single admin profile manually through a trusted server/admin process.
-- Never expose a service-role key in React or in .env files prefixed with VITE_.
