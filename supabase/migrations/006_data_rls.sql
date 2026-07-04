-- Asegura las tablas de datos a nivel de base de datos.
-- Sin políticas, los roles anon/authenticated (la anon key pública del bundle)
-- quedan sin acceso: ya no se pueden leer/modificar gastos ni préstamos con solo
-- extraer la anon key. Todo el acceso a datos pasa ahora por server actions que
-- usan la service-role key (que bypassa RLS) y validan la sesión de PIN.
--
-- REQUIERE configurar SUPABASE_SERVICE_ROLE_KEY en el entorno antes de aplicar,
-- o la app dejará de leer datos.
alter table cards enable row level security;
alter table msi_expenses enable row level security;
alter table loans_given enable row level security;
alter table loans_received enable row level security;
alter table payment_history enable row level security;
