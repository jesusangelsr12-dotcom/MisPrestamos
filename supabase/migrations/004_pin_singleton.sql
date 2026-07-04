-- Garantiza que solo pueda existir un PIN configurado.
-- Elimina el TOCTOU del endpoint de setup: dos setups concurrentes ya no
-- pueden insertar dos filas, y la verificación deja de ser no determinista.
create unique index if not exists pin_auth_singleton on pin_auth ((true));
