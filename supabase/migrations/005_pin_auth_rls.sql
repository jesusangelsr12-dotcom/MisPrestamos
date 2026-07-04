-- Protege el hash del PIN a nivel de base de datos.
-- Sin políticas, los roles anon/authenticated (la anon key pública que viaja en
-- el bundle) quedan sin acceso a pin_auth, por lo que ya no se puede extraer
-- hashed_pin para hacer fuerza bruta offline del PIN.
--
-- Las rutas /api/pin/* usan la service-role key (server-only), que bypassa RLS.
-- REQUIERE configurar SUPABASE_SERVICE_ROLE_KEY en el entorno antes de aplicar
-- esta migración, o las rutas de PIN dejarán de funcionar.
alter table pin_auth enable row level security;
