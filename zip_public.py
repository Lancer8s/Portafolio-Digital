import zipfile
import os

BASE_DIR = "back/public"
OUTPUT_ZIP = "public_html.zip"
EXCLUDE = {"storage"}

if os.path.exists(OUTPUT_ZIP):
    try:
        os.remove(OUTPUT_ZIP)
    except:
        pass

print(f"Creando {OUTPUT_ZIP} desde '{BASE_DIR}/'...")
count = 0

with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
    for root, dirs, files in os.walk(BASE_DIR):
        # Filtrar directorios excluidos (storage)
        dirs[:] = [d for d in dirs if d not in EXCLUDE]
        
        for file in files:
            # Si por alguna razon 'storage' es detectado como archivo
            if file in EXCLUDE:
                continue
                
            file_path = os.path.join(root, file)
            
            try:
                # Omitir enlaces simbolicos para evitar errores de permisos en Windows
                if os.path.islink(file_path):
                    print(f"  Saltando symlink: {file_path}")
                    continue
                    
                rel_path = os.path.relpath(file_path, BASE_DIR)
                # Convertir barras a forward slashes para Linux
                archive_name = rel_path.replace("\\", "/")
                
                zf.write(file_path, archive_name)
                count += 1
            except Exception as e:
                print(f"  No se pudo incluir {file_path}: {e}")

size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
print(f"\n✅ {OUTPUT_ZIP} creado correctamente")
print(f"   Archivos incluidos: {count}")
print(f"   Tamaño: {size_mb:.2f} MB")

# Verificar las rutas dentro del ZIP
print("\nVerificando separadores de ruta en el ZIP...")
with zipfile.ZipFile(OUTPUT_ZIP) as z:
    entries = z.namelist()
    bad = [e for e in entries if "\\" in e]
    print(f"Rutas con backslash (debe ser 0): {len(bad)}")
    print("Primeros 5 archivos en el ZIP:")
    for e in entries[:5]:
        print(f"  - {e}")
