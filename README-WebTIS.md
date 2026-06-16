# Despliegue WebTIS - AID-SOFT.SRL

Datos segun el documento `aidsoft (1).pdf`.

## Dominio

```txt
http://aidsoft.tis.cs.umss.edu.bo
```

## FTP

```txt
Cliente web FTP: http://aidsoft.tis.cs.umss.edu.bo/net2ftp
Usuario: aidsoft
Contrasena: 7cTE4vDiNS2XuaK
```

Opcional con FileZilla, solo desde laboratorios:

```txt
Servidor: 167.157.26.45
Puerto: 21
Usuario: aidsoft
Contrasena: 7cTE4vDiNS2XuaK
```

No eliminar las carpetas del servidor:

```txt
public_html
logs
```

## Base De Datos

```txt
Cliente web: http://aidsoft.tis.cs.umss.edu.bo/phppgadmin
DBMS: pgsql
Host: localhost
Base de datos: aidsoft_db
Usuario: aidsoft
Contrasena: Tg3jM2iqiXSL98S
```

## Backend Laravel

Para WebTIS usar como base:

```txt
back/.env.webtis.example
```

Valores clave:

```txt
APP_URL=http://aidsoft.tis.cs.umss.edu.bo
DB_HOST=localhost
DB_DATABASE=aidsoft_db
DB_USERNAME=aidsoft
DB_PASSWORD=Tg3jM2iqiXSL98S
FRONTEND_URL=http://aidsoft.tis.cs.umss.edu.bo
GITHUB_REDIRECT_URI=http://aidsoft.tis.cs.umss.edu.bo/api/auth/github/callback
```

## Frontend Vite

Para build de produccion usar como base:

```txt
front/.env.production.example
```

Valores:

```txt
VITE_API_BASE_URL=/api
VITE_API_HOST=
```

## GitHub OAuth

En la OAuth App de GitHub, configurar exactamente:

```txt
Authorization callback URL:
http://aidsoft.tis.cs.umss.edu.bo/api/auth/github/callback
```
