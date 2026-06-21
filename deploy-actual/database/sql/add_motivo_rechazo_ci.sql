BEGIN;

ALTER TABLE public.usuario
    ADD COLUMN IF NOT EXISTS motivo_rechazo_ci TEXT NULL;

COMMIT;
