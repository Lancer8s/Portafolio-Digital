BEGIN;

CREATE TABLE public.certificaciones (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    institucion VARCHAR(150) NOT NULL,
    fecha_emision DATE NOT NULL,
    descripcion VARCHAR(500) NULL,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    CONSTRAINT certificaciones_user_id_foreign
        FOREIGN KEY (user_id)
        REFERENCES public.usuario (id_usuario)
        ON DELETE CASCADE
);

CREATE INDEX certificaciones_user_id_fecha_emision_index
    ON public.certificaciones (user_id, fecha_emision);

COMMIT;
