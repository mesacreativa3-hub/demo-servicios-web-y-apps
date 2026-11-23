-- =====================================================================
--  MESA CREATIVA · Catálogo autogestionable (varios negocios) + demo
-- ---------------------------------------------------------------------
--  Dónde: Supabase → tu proyecto → SQL Editor → New query.
--  Pega TODO este archivo y pulsa Run. Se puede ejecutar más de una vez.
--  No toca la tabla "hoy" ni el bucket "hoy" (Novedades del día).
-- =====================================================================

-- ---------- 1. Tablas ----------
create table if not exists public.negocios (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  nombre     text not null,
  whatsapp   text,
  plan       text not null default 'autogestionable'
             check (plan in ('autogestionable', 'web_pro', 'demo')),
  activo     boolean not null default true,
  creado     timestamptz not null default now()
);

-- Quién puede editar cada negocio (usuarios de Authentication)
create table if not exists public.negocio_usuarios (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  primary key (negocio_id, user_id)
);

create table if not exists public.categorias (
  id         uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre     text not null check (char_length(nombre) between 1 and 60),
  orden      int  not null default 0,
  unique (negocio_id, nombre),
  unique (id, negocio_id)
);

create table if not exists public.productos (
  id           uuid primary key default gen_random_uuid(),
  negocio_id   uuid not null references public.negocios(id) on delete cascade,
  categoria_id uuid not null,
  nombre       text not null check (char_length(nombre) between 1 and 120),
  descripcion  text check (char_length(descripcion) <= 400),
  precio       numeric(10,2) not null check (precio >= 0),
  foto         text,
  destacado    boolean not null default false,
  disponible   boolean not null default true,
  orden        int not null default 0,
  actualizado  timestamptz not null default now(),
  -- la categoría tiene que ser del mismo negocio
  foreign key (categoria_id, negocio_id)
    references public.categorias(id, negocio_id) on delete cascade
);
alter table public.negocios add column if not exists web text;  -- dirección de su web (para el botón "Ver mi web")

-- Las fotos solo pueden venir de tu web (/media/...) o del bucket "catalogo" de Supabase
alter table public.productos drop constraint if exists productos_foto_ok;
alter table public.productos add constraint productos_foto_ok check (
  foto is null
  or foto ~ '^/media/[A-Za-z0-9._-]+$'
  or foto ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/catalogo/[0-9a-f-]+/[A-Za-z0-9._-]+$'
);

create index if not exists productos_negocio_idx
  on public.productos (negocio_id, categoria_id, orden);

-- Fecha de última modificación automática
create or replace function public.tocar_actualizado() returns trigger
language plpgsql as $$
begin new.actualizado := now(); return new; end $$;
drop trigger if exists productos_actualizado on public.productos;
create trigger productos_actualizado before update on public.productos
  for each row execute function public.tocar_actualizado();

-- ---------- 2. Funciones de permiso ----------
create or replace function public.es_miembro(n uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.negocio_usuarios
                 where negocio_id = n and user_id = auth.uid());
$$;

create or replace function public.negocio_activo(n uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.negocios where id = n and activo);
$$;

grant execute on function public.es_miembro(uuid)     to anon, authenticated;
grant execute on function public.negocio_activo(uuid) to anon, authenticated;

-- ---------- 3. Seguridad por filas (RLS) ----------
alter table public.negocios         enable row level security;
alter table public.negocio_usuarios enable row level security;
alter table public.categorias       enable row level security;
alter table public.productos        enable row level security;

-- Negocios: cualquiera ve los activos; cada dueño ve el suyo
drop policy if exists negocios_ver on public.negocios;
create policy negocios_ver on public.negocios for select
  using (activo or public.es_miembro(id));
-- Los datos del negocio (plan, activo, web) solo los cambias tú desde Supabase:
-- así un cliente que deja de pagar no puede reactivarse solo.
drop policy if exists negocios_editar on public.negocios;

-- Cada usuario solo ve a qué negocios pertenece (las altas las haces tú en SQL)
drop policy if exists miembros_ver on public.negocio_usuarios;
create policy miembros_ver on public.negocio_usuarios for select to authenticated
  using (user_id = auth.uid());

-- Categorías
drop policy if exists categorias_ver on public.categorias;
create policy categorias_ver on public.categorias for select
  using (public.negocio_activo(negocio_id) or public.es_miembro(negocio_id));
drop policy if exists categorias_crear on public.categorias;
create policy categorias_crear on public.categorias for insert to authenticated
  with check (public.es_miembro(negocio_id));
drop policy if exists categorias_editar on public.categorias;
create policy categorias_editar on public.categorias for update to authenticated
  using (public.es_miembro(negocio_id)) with check (public.es_miembro(negocio_id));
drop policy if exists categorias_borrar on public.categorias;
create policy categorias_borrar on public.categorias for delete to authenticated
  using (public.es_miembro(negocio_id));

-- Productos: el público solo ve los disponibles de negocios activos
drop policy if exists productos_ver on public.productos;
create policy productos_ver on public.productos for select
  using ((disponible and public.negocio_activo(negocio_id)) or public.es_miembro(negocio_id));
drop policy if exists productos_crear on public.productos;
create policy productos_crear on public.productos for insert to authenticated
  with check (public.es_miembro(negocio_id));
drop policy if exists productos_editar on public.productos;
create policy productos_editar on public.productos for update to authenticated
  using (public.es_miembro(negocio_id)) with check (public.es_miembro(negocio_id));
drop policy if exists productos_borrar on public.productos;
create policy productos_borrar on public.productos for delete to authenticated
  using (public.es_miembro(negocio_id));

-- ---------- 4. Vista pública que leen las webs ----------
create or replace view public.catalogo_publico with (security_invoker = true) as
select n.slug  as negocio,
       c.nombre as categoria,
       c.orden  as cat_orden,
       p.id, p.nombre, p.descripcion, p.precio, p.foto, p.destacado, p.orden
from public.productos p
join public.categorias c on c.id = p.categoria_id
join public.negocios  n on n.id = p.negocio_id
where p.disponible and n.activo;
grant select on public.catalogo_publico to anon, authenticated;

-- ---------- 5. Fotos de productos (bucket "catalogo") ----------
-- Cada negocio sube a su carpeta: catalogo/<id del negocio>/archivo.jpg
-- La demo no puede subir fotos (su clave es pública).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists catalogo_subir on storage.objects;
create policy catalogo_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo' and (storage.foldername(name))[1] in
    (select nu.negocio_id::text from public.negocio_usuarios nu
     join public.negocios n on n.id = nu.negocio_id
     where nu.user_id = auth.uid() and n.plan <> 'demo'));
drop policy if exists catalogo_cambiar on storage.objects;
create policy catalogo_cambiar on storage.objects for update to authenticated
  using (bucket_id = 'catalogo' and (storage.foldername(name))[1] in
    (select nu.negocio_id::text from public.negocio_usuarios nu
     join public.negocios n on n.id = nu.negocio_id
     where nu.user_id = auth.uid() and n.plan <> 'demo'));
drop policy if exists catalogo_borrar on storage.objects;
create policy catalogo_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo' and (storage.foldername(name))[1] in
    (select nu.negocio_id::text from public.negocio_usuarios nu
     join public.negocios n on n.id = nu.negocio_id
     where nu.user_id = auth.uid() and n.plan <> 'demo'));

-- ---------- 6. Negocio "demo": Casa Araguaney (93 productos) ----------
insert into public.negocios (slug, nombre, whatsapp, plan, web)
values ('demo', 'Casa Araguaney (restaurante de ejemplo)', '34604343158', 'demo', '/demo-pro.html')
on conflict (slug) do update set nombre = excluded.nombre, plan = 'demo', activo = true, web = excluded.web;

-- Copia maestra de la demo (sin acceso desde la web: RLS activado y sin políticas)
create table if not exists public.demo_semilla (
  categoria text, cat_orden int, nombre text, descripcion text,
  precio numeric(10,2), destacado boolean, foto text, orden int
);
alter table public.demo_semilla enable row level security;
truncate public.demo_semilla;
insert into public.demo_semilla
  (categoria, cat_orden, nombre, descripcion, precio, destacado, foto, orden) values
  ('Desayunos y arepas', 1, 'Arepa reina pepiada', 'Pollo desmechado con aguacate y un toque de mayonesa, la clásica caraqueña.', 5.50, true, null, 1),
  ('Desayunos y arepas', 1, 'Arepa de pabellón', 'Carne mechada, caraotas negras, tajadas de plátano maduro y queso blanco rallado.', 6.00, false, null, 2),
  ('Desayunos y arepas', 1, 'Arepa pelúa', 'Carne mechada jugosa con queso amarillo rallado.', 5.50, false, null, 3),
  ('Desayunos y arepas', 1, 'Arepa de pernil', 'Pernil horneado en su jugo con rodajas de tomate.', 5.50, false, null, 4),
  ('Desayunos y arepas', 1, 'Arepa dominó', 'Caraotas negras y queso blanco rallado.', 4.00, false, null, 5),
  ('Desayunos y arepas', 1, 'Arepa de perico', 'Huevos revueltos con tomate y cebolla.', 3.75, false, null, 6),
  ('Desayunos y arepas', 1, 'Arepa de queso de mano', 'Queso de mano fresco y mantequilla.', 4.50, false, null, 7),
  ('Desayunos y arepas', 1, 'Arepa de chicharrón', 'Chicharrón crujiente con guasacaca de la casa.', 5.00, false, null, 8),
  ('Desayunos y arepas', 1, 'Desayuno criollo', 'Dos arepas, perico, caraotas, queso blanco rallado y nata.', 8.50, true, '/media/bandeja-desayuno.jpg', 9),
  ('Desayunos y arepas', 1, 'Desayuno Ávila', 'Huevos al gusto, tocineta, pan canilla y café con leche.', 7.50, false, null, 10),
  ('Desayunos y arepas', 1, 'Cachito de jamón', 'Pan de cachito recién horneado relleno de jamón ahumado.', 2.50, false, '/media/croissant-chocolate.jpg', 11),
  ('Desayunos y arepas', 1, 'Pan de jamón (porción)', 'Relleno de jamón, tocineta, pasas y aceitunas.', 3.50, false, null, 12),
  ('Empanadas y pasapalos', 2, 'Empanada de carne mechada', 'Masa de maíz frita, crujiente por fuera.', 2.50, false, null, 1),
  ('Empanadas y pasapalos', 2, 'Empanada de pollo', 'Pollo guisado con ají dulce.', 2.50, false, null, 2),
  ('Empanadas y pasapalos', 2, 'Empanada de queso', 'Queso blanco rallado.', 2.00, false, null, 3),
  ('Empanadas y pasapalos', 2, 'Empanada de cazón', 'Cazón guisado al estilo oriental.', 3.00, false, null, 4),
  ('Empanadas y pasapalos', 2, 'Empanada de pabellón', 'Carne mechada, caraotas, tajada y queso.', 3.00, false, null, 5),
  ('Empanadas y pasapalos', 2, 'Tequeños (6 unidades)', 'Palitos de queso blanco envueltos en masa crujiente, con salsa de la casa.', 7.50, true, null, 6),
  ('Empanadas y pasapalos', 2, 'Tostones con guasacaca', 'Plátano verde frito y aplastado, con guasacaca.', 5.50, false, null, 7),
  ('Empanadas y pasapalos', 2, 'Bolitas de yuca con queso (8)', 'Yuca frita rellena de queso blanco.', 5.50, false, null, 8),
  ('Empanadas y pasapalos', 2, 'Patacón maracucho', 'Plátano verde con carne mechada, pollo, queso y salsas.', 8.50, false, null, 9),
  ('Cachapas', 3, 'Cachapa con queso de mano', 'Maíz tierno dorado en budare con queso de mano.', 7.00, true, null, 1),
  ('Cachapas', 3, 'Cachapa con queso y pernil', 'Con queso de mano y pernil horneado.', 9.50, false, null, 2),
  ('Cachapas', 3, 'Cachapa con queso y chicharrón', 'Con queso de mano y chicharrón crujiente.', 9.00, false, null, 3),
  ('Cachapas', 3, 'Cachapa con queso y nata', 'Con queso de mano y nata.', 7.50, false, null, 4),
  ('Cachapas', 3, 'Cachapa con queso y carne mechada', 'Con queso de mano y carne mechada.', 9.50, false, null, 5),
  ('Platos criollos', 4, 'Pabellón criollo', 'Carne mechada, arroz blanco, caraotas negras y tajadas.', 9.50, true, null, 1),
  ('Platos criollos', 4, 'Pabellón con baranda', 'Pabellón criollo con huevo frito y queso rallado.', 11.00, false, null, 2),
  ('Platos criollos', 4, 'Asado negro', 'Muchacho redondo en salsa de papelón, con arroz blanco y tajadas.', 11.50, true, null, 3),
  ('Platos criollos', 4, 'Polvorosa de pollo', 'Pastel de pollo guisado con masa hojaldrada y dulce.', 9.00, false, null, 4),
  ('Platos criollos', 4, 'Pollo guisado', 'Con arroz blanco y tajadas.', 8.50, false, null, 5),
  ('Platos criollos', 4, 'Lengua en salsa', 'Lengua de res en salsa criolla, con arroz y papas.', 10.50, false, null, 6),
  ('Platos criollos', 4, 'Pastel de chucho', 'Capas de plátano maduro, cazón guisado y queso.', 10.00, false, null, 7),
  ('Platos criollos', 4, 'Pisillo de res con arepitas', 'Carne seca desmenuzada y sofrita, con arepitas fritas.', 9.00, false, null, 8),
  ('Platos criollos', 4, 'Hallaca (temporada)', 'Masa de maíz rellena de guiso de res, cerdo y gallina, en hoja de plátano.', 6.50, false, null, 9),
  ('Platos criollos', 4, 'Plato navideño (temporada)', 'Hallaca, pernil, ensalada de gallina y pan de jamón.', 14.00, false, null, 10),
  ('Parrilla', 5, 'Parrilla mixta para 2', 'Lomito, pollo, chorizo y morcilla con yuca, ensalada y guasacaca.', 28.00, true, null, 1),
  ('Parrilla', 5, 'Solomo de cuerito (300 g)', 'Corte jugoso a la brasa con contorno a elegir.', 16.00, false, null, 2),
  ('Parrilla', 5, 'Punta trasera (300 g)', 'A la brasa con contorno a elegir.', 15.00, false, null, 3),
  ('Parrilla', 5, 'Lomito a la parrilla (250 g)', 'Corte tierno con contorno a elegir.', 17.00, false, null, 4),
  ('Parrilla', 5, 'Entrecot a la brasa (300 g)', 'Con papas y ensalada.', 18.00, false, '/media/Entrecot_a_la_brasa.jpg', 5),
  ('Parrilla', 5, 'Pechuga a la parrilla', 'Pechuga marinada con contorno a elegir.', 10.00, false, null, 6),
  ('Parrilla', 5, 'Chorizo y morcilla con arepitas', 'Para picar en la mesa.', 7.50, false, null, 7),
  ('Parrilla', 5, 'Costillas de cerdo BBQ', 'Glaseadas con salsa barbacoa, con papas fritas.', 15.50, false, null, 8),
  ('Pescados y mariscos', 6, 'Pescado frito con tostones', 'Pargo o corocoro según disponibilidad, con ensalada.', 15.00, true, null, 1),
  ('Pescados y mariscos', 6, 'Filete de mero a la plancha', 'Con arroz y vegetales salteados.', 16.00, false, null, 2),
  ('Pescados y mariscos', 6, 'Camarones al ajillo', 'En aceite de oliva, ajo y perejil, con pan tostado.', 14.50, false, '/media/Gambas_al_ajillo.jpg', 3),
  ('Pescados y mariscos', 6, 'Arroz con mariscos', 'Arroz meloso con camarones, calamar y mejillones.', 16.50, false, '/media/Arroz_meloso_de_marisco.jpg', 4),
  ('Pescados y mariscos', 6, 'Ceviche de pescado', 'Pescado blanco curado en limón con cebolla morada y cilantro.', 11.00, false, null, 5),
  ('Pescados y mariscos', 6, 'Cóctel de camarones', 'Camarones en salsa rosada con galletas.', 10.00, false, null, 6),
  ('Pescados y mariscos', 6, 'Calamares fritos', 'Aros de calamar rebozados con salsa tártara.', 10.50, false, null, 7),
  ('Pescados y mariscos', 6, 'Pabellón margariteño', 'Cazón guisado, arroz, caraotas y tajadas.', 12.00, false, null, 8),
  ('Sopas', 7, 'Sopa de res (hervido)', 'Con verduras, mazorca y arepitas.', 7.50, true, null, 1),
  ('Sopas', 7, 'Sopa de gallina', 'Con verduras y fideos.', 7.00, false, null, 2),
  ('Sopas', 7, 'Mondongo', 'Mondongo de res con garbanzos y verduras.', 8.00, false, null, 3),
  ('Sopas', 7, 'Sopa de pescado', 'Con verduras y un toque de cilantro.', 8.50, false, null, 4),
  ('Sopas', 7, 'Crema de auyama', 'Suave y cremosa, con queso rallado.', 5.00, false, null, 5),
  ('Hamburguesas y sándwiches', 8, 'Hamburguesa clásica', 'Carne de 160 g, queso, lechuga y tomate, con papas fritas.', 9.00, false, null, 1),
  ('Hamburguesas y sándwiches', 8, 'Hamburguesa Araguaney', 'Doble carne, queso de año, tocineta y plátano maduro, con papas.', 12.00, true, null, 2),
  ('Hamburguesas y sándwiches', 8, 'Perro caliente caraqueño', 'Con repollo, cebolla, papitas rayadas y salsas.', 3.50, false, null, 3),
  ('Hamburguesas y sándwiches', 8, 'Pepito de lomito', 'Pan canilla con lomito, queso, papitas y salsas.', 11.00, false, null, 4),
  ('Hamburguesas y sándwiches', 8, 'Pepito de pollo', 'Pan canilla con pollo a la plancha, queso, papitas y salsas.', 9.00, false, null, 5),
  ('Hamburguesas y sándwiches', 8, 'Club house', 'Pollo, jamón, queso, tocineta y huevo, con papas.', 8.50, false, null, 6),
  ('Hamburguesas y sándwiches', 8, 'Sándwich de pernil', 'Pernil horneado, queso y salsa de la casa.', 7.00, false, '/media/sandwich.jpg', 7),
  ('Hamburguesas y sándwiches', 8, 'Wrap de pollo crujiente', 'Pollo empanizado, lechuga, tomate y salsa de ajo.', 7.50, false, '/media/wraps-crujientes.jpg', 8),
  ('Contornos', 9, 'Tajadas', 'Plátano maduro frito.', 3.00, false, null, 1),
  ('Contornos', 9, 'Yuca frita o sancochada', 'Porción mediana.', 3.00, false, null, 2),
  ('Contornos', 9, 'Papas fritas', 'Porción mediana.', 3.00, false, null, 3),
  ('Contornos', 9, 'Arroz blanco', 'Porción mediana.', 2.00, false, null, 4),
  ('Contornos', 9, 'Caraotas negras', 'Porción mediana.', 2.50, false, null, 5),
  ('Contornos', 9, 'Ensalada mixta', 'Lechuga, tomate, cebolla y zanahoria.', 3.50, false, null, 6),
  ('Contornos', 9, 'Arepitas fritas (4)', 'Pequeñas y crujientes.', 2.50, false, null, 7),
  ('Contornos', 9, 'Guasacaca (porción)', 'Salsa de aguacate, ají y cilantro.', 1.50, false, null, 8),
  ('Postres', 10, 'Quesillo', 'Flan venezolano con caramelo.', 4.00, true, null, 1),
  ('Postres', 10, 'Tres leches', 'Bizcocho bañado en tres leches con merengue.', 4.50, false, null, 2),
  ('Postres', 10, 'Bienmesabe', 'Bizcocho con crema de coco y canela.', 5.00, false, null, 3),
  ('Postres', 10, 'Marquesa de chocolate', 'Capas de galleta y crema de chocolate.', 5.00, false, null, 4),
  ('Postres', 10, 'Torta de queso con frutos rojos', 'Cremosa, con salsa de frutos rojos.', 5.50, false, '/media/Tarta_de_queso_con_frutos_rojos.jpg', 5),
  ('Postres', 10, 'Golfeados (2)', 'Con papelón, anís y queso de mano.', 4.50, false, '/media/rollos-canela.jpg', 6),
  ('Postres', 10, 'Dulce de lechosa', 'Lechosa en almíbar con queso blanco.', 3.50, false, null, 7),
  ('Postres', 10, 'Mousse de parchita', 'Ligero y ácido, con salsa de parchita.', 4.50, false, null, 8),
  ('Bebidas', 11, 'Papelón con limón', 'Bebida tradicional bien fría.', 2.00, true, null, 1),
  ('Bebidas', 11, 'Jugo natural', 'Parchita, mango, guanábana o fresa.', 2.50, false, null, 2),
  ('Bebidas', 11, 'Merengada', 'De fresa, lechosa o cambur.', 3.50, false, null, 3),
  ('Bebidas', 11, 'Chicha venezolana', 'Bebida de arroz con canela.', 3.00, false, null, 4),
  ('Bebidas', 11, 'Tizana', 'Frutas picadas en jugo de naranja y granadina.', 3.00, false, null, 5),
  ('Bebidas', 11, 'Refresco en lata', 'Variedad de sabores.', 1.50, false, null, 6),
  ('Bebidas', 11, 'Agua mineral 600 ml', 'Con o sin gas.', 1.00, false, null, 7),
  ('Bebidas', 11, 'Malta', 'Botella de 250 ml.', 1.50, false, null, 8),
  ('Bebidas', 11, 'Cerveza nacional', 'Tercio bien frío.', 2.00, false, null, 9),
  ('Bebidas', 11, 'Café guayoyo o marrón', 'Café venezolano recién colado.', 1.50, false, null, 10),
  ('Bebidas', 11, 'Cappuccino', 'Espresso con leche espumada.', 2.50, false, null, 11),
  ('Bebidas', 11, 'Trago de ron venezolano', 'Ron añejo, solo o con hielo.', 4.00, false, null, 12);

-- Deja la demo como nueva (borra lo que hayan cambiado y recarga la copia maestra)
create or replace function public.reset_demo() returns void
language plpgsql security definer set search_path = public as $$
declare d uuid;
begin
  select id into d from public.negocios where slug = 'demo';
  delete from public.categorias where negocio_id = d;           -- borra también sus productos
  insert into public.categorias (negocio_id, nombre, orden)
    select distinct d, categoria, cat_orden from public.demo_semilla;
  insert into public.productos (negocio_id, categoria_id, nombre, descripcion, precio, destacado, foto, orden)
    select d, c.id, s.nombre, s.descripcion, s.precio, s.destacado, s.foto, s.orden
    from public.demo_semilla s
    join public.categorias c on c.negocio_id = d and c.nombre = s.categoria;
end $$;
revoke all on function public.reset_demo() from public, anon, authenticated;

select public.reset_demo();

-- ---------- 7. Usuario de prueba del panel ----------
-- Antes: Authentication → Users → Add user → Create new user
--   correo: demo@example.com · contraseña: DemoMesa2026 · marca "Auto Confirm User".
-- Si el usuario aún no existe, esta línea no hace nada (vuelve a ejecutarla después).
insert into public.negocio_usuarios (negocio_id, user_id)
select n.id, u.id from public.negocios n, auth.users u
where n.slug = 'demo' and u.email = 'demo@example.com'
on conflict do nothing;

-- ---------- 8. Recomendado: restablecer la demo cada hora ----------
-- La clave de la demo es pública: cualquiera puede cambiar precios o textos.
-- Activa "pg_cron" en Database → Extensions y luego quita los dos guiones:
-- select cron.schedule('reset-demo', '0 * * * *', $$select public.reset_demo()$$);

-- ---------- 9. Comprobación ----------
select categoria, count(*) as productos
from public.catalogo_publico where negocio = 'demo'
group by categoria, cat_orden order by cat_orden;

-- =====================================================================
--  ALTA DE UN CLIENTE NUEVO (copia, cambia los datos y ejecuta aparte)
-- ---------------------------------------------------------------------
-- 1) Crea su usuario en Authentication → Users (correo y clave del cliente).
-- 2) Ejecuta, cambiando slug, nombre, WhatsApp y correo:
--
-- insert into public.negocios (slug, nombre, whatsapp, plan, web)
--   values ('panaderia-la-esquina', 'Panadería La Esquina', '584121234567', 'autogestionable',
--           'https://panaderia-la-esquina.workers.dev');
-- insert into public.negocio_usuarios (negocio_id, user_id)
--   select n.id, u.id from public.negocios n, auth.users u
--   where n.slug = 'panaderia-la-esquina' and u.email = 'cliente@correo.com';
-- insert into public.categorias (negocio_id, nombre, orden)
--   select id, x.nombre, x.orden from public.negocios,
--          (values ('Panes', 1), ('Dulces', 2), ('Bebidas', 3)) as x(nombre, orden)
--   where slug = 'panaderia-la-esquina';
-- =====================================================================
