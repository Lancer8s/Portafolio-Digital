"""
Crea el backend_laravel.zip correctamente para subir a servidor Linux.
Usa barras / en vez de \ para que el servidor descomprima las carpetas correctamente.
"""
import zipfile
import os
import sys

# Carpetas y archivos a EXCLUIR del ZIP
EXCLUDE_DIRS = {"public", "node_modules", ".git", "__pycache__"}
EXCLUDE_FILES = {"docker-compose.yml", "Dockerfile", ".dockerignore", "zip_backend.py"}
EXCLUDE_EXTENSIONS = {".pyc"}

BASE_DIR = "back"
OUTPUT_ZIP = "backend_laravel.zip"

def should_exclude(rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    # Excluir si algún directorio padre está en la lista de excluidos
    for part in parts[:-1]:  # todos menos el último (que es el archivo)
        if part in EXCLUDE_DIRS:
            return True
    # Excluir archivos específicos en la raíz
    if len(parts) == 1 and parts[0] in EXCLUDE_FILES:
        return True
    # Excluir por extensión
    _, ext = os.path.splitext(parts[-1])
    if ext in EXCLUDE_EXTENSIONS:
        return True
    return False

print(f"Creando {OUTPUT_ZIP} desde '{BASE_DIR}/'...")
count = 0

with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
    for root, dirs, files in os.walk(BASE_DIR):
        # Filtrar directorios excluidos (modifica dirs in-place para evitar recursión)
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            file_path = os.path.join(root, file)
            # Ruta relativa desde la raíz del proyecto (sin el prefijo "back/")
            rel_path = os.path.relpath(file_path, BASE_DIR)
            
            # Convertir a forward slashes para que funcione en Linux
            archive_name = rel_path.replace("\\", "/")

            if should_exclude(archive_name):
                continue

            zf.write(file_path, archive_name)
            count += 1
            if count % 500 == 0:
                print(f"  {count} archivos comprimidos...")

size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
print(f"\n✅ ¡Listo! {OUTPUT_ZIP} creado correctamente")
print(f"   Archivos incluidos: {count}")
print(f"   Tamaño: {size_mb:.2f} MB")
print(f"\nAhora sube este archivo al servidor FTP en la RAÍZ /")
