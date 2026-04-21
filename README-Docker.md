# 🐳 Portafolio Digital — Guía Docker

Esta guía permite levantar **todo el proyecto** (frontend, backend y base de datos) con un solo comando, sin instalar PHP, Composer, Node.js ni PostgreSQL en tu máquina.

---

## Requisitos previos

1. **Instalar Docker Desktop** → [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Durante la instalación, aceptar los valores por defecto.
   - Al finalizar, **reiniciar la computadora** si lo pide.
   - Abrir Docker Desktop y esperar a que diga **"Docker Desktop is running"** (icono verde en la barra de tareas).

2. **Instalar Git** (si no lo tienes) → [https://git-scm.com/downloads](https://git-scm.com/downloads)

---

## Levantar el proyecto

Abrir una terminal (PowerShell o CMD) y ejecutar:

```bash
# 1. Clonar el repositorio (o pedir el .zip al equipo)
git clone <URL_DEL_REPOSITORIO> "Portafolio Digital"
cd "Portafolio Digital"

# 2. Levantar todo con Docker (la primera vez tarda ~3-5 min)
docker compose up --build
```

**¡Listo!** Cuando veas mensajes de que los servidores están corriendo, abre en tu navegador:

| Servicio   | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:3000       |
| Backend    | http://localhost:8000       |
| PostgreSQL | `localhost:5432` (pgAdmin)  |

---

## Comandos útiles

```bash
# Levantar en segundo plano (sin ver logs)
docker compose up -d --build

# Ver los logs de un servicio específico
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# Detener todo
docker compose down

# Detener y BORRAR la base de datos (empezar de cero)
docker compose down -v

# Reconstruir un servicio específico
docker compose up --build backend
```

---

## Solución de problemas comunes

### "Puerto 5432 ya está en uso"
Tienes PostgreSQL corriendo localmente. Opciones:
- Detener el servicio local: `net stop postgresql-x64-12` (o similar)
- O cambiar el puerto en `docker-compose.yml`: `"5433:5432"`

### "Puerto 3000 o 8000 ya en uso"
Otro programa usa ese puerto. Ciérralo o cambia el puerto en `docker-compose.yml`.

### El backend no conecta a la BD
Asegúrate de que el contenedor de postgres esté sano:
```bash
docker compose ps
```
Si postgres muestra `(unhealthy)`, revisa los logs:
```bash
docker compose logs postgres
```

### Cambios en el código no se reflejan
Los volúmenes montan el código en vivo, así que los cambios se reflejan automáticamente.
Si editaste `composer.json` o `package.json`, reconstruye:
```bash
docker compose up --build
```

### Quiero empezar con la BD limpia
```bash
docker compose down -v
docker compose up --build
```
El flag `-v` borra los volúmenes (datos de la BD).

---

## Estructura Docker

```
Portafolio Digital/
├── docker-compose.yml          ← Orquestador principal
├── docker/
│   └── postgres/
│       ├── 01-schema.sql       ← Tablas, triggers, datos iniciales
│       └── 02-stored-procedures.sql  ← Procedimientos almacenados
├── back/
│   ├── Dockerfile              ← Imagen PHP 7.4 + Laravel
│   └── .dockerignore
└── front/
    ├── Dockerfile.frontend     ← Imagen Node 20 + Vite
    └── .dockerignore
```

---

## Credenciales por defecto

| Recurso    | Usuario    | Contraseña   |
|------------|------------|-------------|
| PostgreSQL | `postgres` | `mundolibre` |
| BD nombre  | `portafolio_digital` | — |
