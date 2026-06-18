# ============================================================
#  deploy.ps1  —  Script de build y deploy para PortaGen
#  Uso: Ejecutar desde la carpeta raíz del proyecto
#       .\deploy.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$FRONT_DIR   = "$PSScriptRoot\front"
$DEPLOY_DIR  = "$PSScriptRoot\deploy-actual"
$VIEWS_HTML  = "$DEPLOY_DIR\resources\views\index.html"
$PUBLIC_HTML = "$DEPLOY_DIR\public_html"
$ASSETS_DIR  = "$PUBLIC_HTML\assets"

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "  PortaGen — Deploy Script" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# ── 1. Build ──────────────────────────────────────────────
Write-Host "[1/4] Compilando frontend..." -ForegroundColor Yellow
Set-Location $FRONT_DIR
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en el build." -ForegroundColor Red; exit 1 }
Write-Host "      Build completado." -ForegroundColor Green

# ── 2. Detectar nuevo bundle ──────────────────────────────
Write-Host "[2/4] Detectando nuevo bundle JS..." -ForegroundColor Yellow
$newBundle = Get-ChildItem "$FRONT_DIR\dist\assets\index-*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $newBundle) { Write-Host "ERROR: No se encontro bundle en dist/assets/." -ForegroundColor Red; exit 1 }
$bundleName = $newBundle.Name
Write-Host "      Bundle detectado: $bundleName" -ForegroundColor Green

# ── 3. Copiar assets a deploy-actual ──────────────────────
Write-Host "[3/4] Copiando assets a deploy-actual..." -ForegroundColor Yellow

# Eliminar bundles JS viejos (los que ya no son el actual)
Get-ChildItem "$ASSETS_DIR\index-*.js" | Where-Object { $_.Name -ne $bundleName } | ForEach-Object {
    Write-Host "      Eliminando bundle viejo: $($_.Name)" -ForegroundColor DarkGray
    Remove-Item $_.FullName -Force
}

# Copiar el nuevo bundle
Copy-Item "$FRONT_DIR\dist\assets\$bundleName" "$ASSETS_DIR\$bundleName" -Force
Write-Host "      Copiado: $bundleName" -ForegroundColor Green

# Copiar CSS (siempre el mismo nombre con hash)
$newCss = Get-ChildItem "$FRONT_DIR\dist\assets\index-*.css" | Select-Object -First 1
if ($newCss) {
    Copy-Item $newCss.FullName "$ASSETS_DIR\$($newCss.Name)" -Force
    Write-Host "      Copiado CSS: $($newCss.Name)" -ForegroundColor Green
}

# ── 4. Actualizar AMBOS index.html ────────────────────────
Write-Host "[4/4] Actualizando referencias al bundle..." -ForegroundColor Yellow

# Leer el index.html generado por Vite
$viteDist = Get-Content "$FRONT_DIR\dist\index.html" -Raw

# Extraer nombre del CSS
$cssMatch = [regex]::Match($viteDist, 'href="/assets/(index-[^"]+\.css)"')
$cssName  = if ($cssMatch.Success) { $cssMatch.Groups[1].Value } else { "index-bliC0zzo.css" }

# Construir el HTML final con los nombres correctos
$htmlContent = @"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PORTAGEN</title>
    <script type="module" crossorigin src="/assets/$bundleName"></script>
    <link rel="stylesheet" crossorigin href="/assets/$cssName">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"@

# Actualizar public_html/index.html
Set-Content "$PUBLIC_HTML\index.html" $htmlContent -Encoding UTF8
Write-Host "      Actualizado: public_html/index.html -> $bundleName" -ForegroundColor Green

# Actualizar resources/views/index.html (EL QUE USA LARAVEL)
Set-Content $VIEWS_HTML $htmlContent -Encoding UTF8
Write-Host "      Actualizado: resources/views/index.html -> $bundleName" -ForegroundColor Green

# ── Resumen final ─────────────────────────────────────────
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "  DEPLOY LISTO" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sube estos archivos por FTP a tu servidor:" -ForegroundColor White
Write-Host "  public_html/assets/$bundleName" -ForegroundColor Yellow
if ($newCss) { Write-Host "  public_html/assets/$($newCss.Name)" -ForegroundColor Yellow }
Write-Host "  public_html/index.html" -ForegroundColor Yellow
Write-Host "  resources/views/index.html   <-- EL MAS IMPORTANTE" -ForegroundColor Red
Write-Host ""
Write-Host "Elimina del servidor el bundle JS anterior (el que ya no aparece aqui arriba)." -ForegroundColor DarkGray
Write-Host ""
