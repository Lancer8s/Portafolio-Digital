# Normalización BD AidSoft / PortaGen

Este paquete prepara la base PostgreSQL para una estructura normalizada en español sin romper la aplicación actual.

## Archivo principal

```txt
database/sql/normalizacion_espanol_v2.sql
```

## Qué hace

- Crea catálogos normalizados:
  - `visibilidad_perfil`
  - `estado_verificacion`
  - `contexto_imagen`
  - `tipo_red_social`
  - `tipo_habilidad`
  - `categoria_habilidad`
  - `nivel_academico`
  - `modulo_bitacora`
  - `accion_bitacora`
- Separa datos de usuario en:
  - `cuenta_usuario`
  - `perfil_usuario`
  - `red_social_usuario`
  - `verificacion_identidad`
- Separa la tabla legacy `experiencia` en:
  - `experiencia_laboral`
  - `formacion_academica`
- Migra `certificaciones` hacia:
  - `certificacion`
- Prepara `habilidad` con llaves foráneas hacia tipo/categoría.
- Crea bitácora unificada:
  - `bitacora`

## Qué NO hace

- No elimina tablas antiguas.
- No renombra `migrations`.
- No renombra `personal_access_tokens`.
- No rompe Laravel Sanctum.
- No elimina procedimientos almacenados legacy.

## Cómo aplicarlo sin SSH

Si tienes pgAdmin/phpPgAdmin:

1. Haz respaldo completo de la base.
2. Abre `database/sql/normalizacion_espanol_v2.sql`.
3. Ejecuta el script completo.
4. Verifica que se hayan creado las tablas nuevas.

Si solo tienes FTP:

No ejecutes este SQL desde una ruta pública permanente. Primero pide un ejecutor temporal protegido para correr únicamente este SQL y luego eliminarlo.

