-- Base de datos de Date's with Muu. Se pega una sola vez en Supabase > SQL Editor > New query > Run.
-- Solo una pareja (dos cuentas) ve sus datos. Nadie escribe directo en las tablas: todo pasa por las funciones de abajo.

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.members (
  user_id uuid primary key references auth.users on delete cascade,
  couple_id uuid not null references public.couples on delete cascade,
  joined_at timestamptz not null default now()
);
create index members_couple on public.members (couple_id);

create sequence public.items_seq;

-- Cada libreta, cita o dato compartido. `version` detecta si dos personas editaron lo mismo a la vez.
create table public.items (
  couple_id uuid not null references public.couples on delete cascade,
  kind text not null check (kind in ('book', 'date', 'meta')),
  id text not null,
  data jsonb,
  version integer not null default 1,
  deleted boolean not null default false,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  seq bigint not null default nextval('public.items_seq'),
  primary key (couple_id, kind, id)
);
create index items_seq_index on public.items (couple_id, seq);

create function public.my_couple() returns uuid
language sql stable security definer set search_path = '' as $$
  select couple_id from public.members where user_id = auth.uid();
$$;

-- Solo quien entró con su cuenta puede leer, y solo lo que permiten las reglas de abajo.
revoke all on public.couples, public.members, public.items from public, anon, authenticated;
grant select on public.couples, public.members, public.items to authenticated;

alter table public.couples enable row level security;
alter table public.members enable row level security;
alter table public.items enable row level security;

create policy "ver mi pareja" on public.couples for select to authenticated using (id = public.my_couple());
create policy "ver a mi pareja" on public.members for select to authenticated using (couple_id = public.my_couple());
create policy "ver lo nuestro" on public.items for select to authenticated using (couple_id = public.my_couple());

-- Crea la pareja de quien aún no tiene y devuelve su código de invitación.
create function public.create_couple() returns table (couple_id uuid, invite_code text, member_count integer)
language plpgsql security definer set search_path = '' as $$
declare new_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  if public.my_couple() is null then
    insert into public.couples (id, invite_code) values (new_id, upper(substr(md5(gen_random_uuid()::text), 1, 8)));
    insert into public.members (user_id, couple_id) values (auth.uid(), new_id);
  end if;
  return query select c.id, c.invite_code, (select count(*)::integer from public.members m where m.couple_id = c.id)
    from public.couples c where c.id = public.my_couple();
end;
$$;

-- Une a la segunda persona con el código. Una pareja no admite a una tercera.
create function public.join_couple(code text) returns table (couple_id uuid, invite_code text, member_count integer)
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  if public.my_couple() is not null then raise exception 'ya_tiene_pareja'; end if;
  select c.id into target from public.couples c where c.invite_code = upper(trim(code));
  if target is null then raise exception 'codigo_invalido'; end if;
  if (select count(*) from public.members m where m.couple_id = target) >= 2 then raise exception 'pareja_completa'; end if;
  insert into public.members (user_id, couple_id) values (auth.uid(), target);
  return query select c.id, c.invite_code, (select count(*)::integer from public.members m where m.couple_id = c.id)
    from public.couples c where c.id = target;
end;
$$;

-- Guarda un documento solo si nadie lo cambió desde la versión que se tenía. Si no, avisa del conflicto.
create function public.push_item(p_kind text, p_id text, p_data jsonb, p_base integer, p_deleted boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  owner_couple uuid := public.my_couple();
  current_version integer;
begin
  if owner_couple is null then raise exception 'sin_pareja'; end if;
  if pg_column_size(p_data) > 5000000 then raise exception 'demasiado_grande'; end if;
  select version into current_version from public.items
    where couple_id = owner_couple and kind = p_kind and id = p_id for update;
  if not found then
    insert into public.items (couple_id, kind, id, data, deleted, updated_by)
      values (owner_couple, p_kind, p_id, p_data, p_deleted, auth.uid());
    return jsonb_build_object('ok', true, 'version', 1);
  end if;
  if current_version <> p_base then
    return jsonb_build_object('conflict', true, 'version', current_version);
  end if;
  update public.items set data = p_data, deleted = p_deleted, version = current_version + 1, updated_by = auth.uid(),
    updated_at = now(), seq = nextval('public.items_seq')
    where couple_id = owner_couple and kind = p_kind and id = p_id;
  return jsonb_build_object('ok', true, 'version', current_version + 1);
end;
$$;

revoke all on function public.my_couple(), public.create_couple(), public.join_couple(text), public.push_item(text, text, jsonb, integer, boolean) from public, anon;
grant execute on function public.my_couple(), public.create_couple(), public.join_couple(text), public.push_item(text, text, jsonb, integer, boolean) to authenticated;

-- Las fotos van en un depósito privado, en una carpeta por pareja.
insert into storage.buckets (id, name, public, file_size_limit) values ('fotos', 'fotos', false, 20971520);
create policy "fotos: ver" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.my_couple()::text);
create policy "fotos: subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.my_couple()::text);
create policy "fotos: reemplazar" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = public.my_couple()::text);

-- Avisa al otro dispositivo en cuanto hay cambios.
alter publication supabase_realtime add table public.items;
