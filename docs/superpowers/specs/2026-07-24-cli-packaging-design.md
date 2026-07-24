# Especificación de Diseño: Empaquetado y Distribución de CLI (Ejecutables Nativos y Python Wheels)

**Fecha**: 2026-07-24  
**Estado**: Propuesto  
**Autor**: Antigravity

---

## 1. Introducción y Objetivos
El objetivo de este diseño es empaquetar y distribuir la CLI `skillvault` de modo que los usuarios puedan utilizarla independientemente de si tienen instalado Node.js o no, e integrarse en ecosistemas de Python mediante un paquete distribuible (`wheel`).

### Objetivos clave:
1. **Ejecutables Nativos**: Generar binarios independientes para Windows, macOS y Linux que contengan el runtime de Node.js embebido usando `@yao-pkg/pkg`.
2. **Distribución en Python**:
   - **Wheel de Plataforma (Heavy)**: Wheels específicos de plataforma que incluyan el binario compilado nativo. Al instalarse, el comando `skillvault` llamará a este binario de forma directa y transparente.
   - **Wheel Universal (Light)**: Un único wheel universal (`any`) que contenga el bundle compilado de JavaScript y llame a `node` instalado en el sistema del usuario.
3. **Automatización en Releases**: Compilar y adjuntar de manera automática todos estos artefactos a cada release en el repositorio de GitHub.

---

## 2. Estructura de Archivos
Se agregarán y modificarán los siguientes archivos en la estructura del proyecto:

```
cli/
├── dist/                          # Salida de compilación (excluido de git)
│   ├── bin/                       # Ejecutables de pkg
│   └── wheels/                    # Archivos .whl generados
├── python/                        # Código del paquete de Python
│   ├── pyproject.toml             # Configuración del paquete de Python
│   └── skillvault/
│       ├── __init__.py            # Metadatos del paquete
│       ├── __main__.py            # Permite ejecutar python -m skillvault
│       └── cli.py                 # Lógica de detección e invocación de subprocesos
├── build-dist.js                  # Script orquestador de empaquetado en Node.js
└── package.json                   # Scripts actualizados para el empaquetado
.github/
└── workflows/
    └── release.yml                # Workflow de publicación en GitHub Releases
```

---

## 3. Lógica del Envoltorio de Python (`cli/python/skillvault/cli.py`)
El script wrapper en Python actuará como el punto de entrada registrado por `console_scripts`. Su lógica principal será:

```python
import sys
import subprocess
import os
import shutil

def main():
    # Obtener el directorio actual del paquete
    pkg_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Ruta al binario nativo (si existe en el wheel de plataforma)
    binary_name = "skillvault-bin"
    if os.name == "nt":
        binary_name += ".exe"
    
    binary_path = os.path.join(pkg_dir, binary_name)
    
    # 1. Variante de Rueda de Plataforma (Heavy)
    if os.path.exists(binary_path):
        try:
            res = subprocess.run([binary_path] + sys.argv[1:])
            sys.exit(res.returncode)
        except Exception as e:
            print(f"Error executing embedded binary: {e}", file=sys.stderr)
            sys.exit(1)
            
    # 2. Variante de Rueda Pura/Universal (Light)
    bundle_path = os.path.join(pkg_dir, "skillvault.bundle.cjs")
    if os.path.exists(bundle_path):
        node_path = shutil.which("node")
        if not node_path:
            print(
                "Error: Node.js is required to run the light version of skillvault.\n"
                "Please install Node.js (v18+) or install the platform-specific native package.",
                file=sys.stderr
            )
            sys.exit(1)
        try:
            res = subprocess.run([node_path, bundle_path] + sys.argv[1:])
            sys.exit(res.returncode)
        except Exception as e:
            print(f"Error executing JS bundle with Node.js: {e}", file=sys.stderr)
            sys.exit(1)

    print("Error: skillvault installation is corrupted. No executable or JS bundle found.", file=sys.stderr)
    sys.exit(1)
```

---

## 4. Script Orquestador en Node (`cli/build-dist.js`)
Este script automatiza el build paso a paso:

1. **Compilar JavaScript**: `npm run build` genera `dist/skillvault.bundle.cjs`.
2. **Compilar Ejecutables con Pkg**:
   - Corre `npx pkg . --out-path dist/bin/`.
   - Genera archivos como:
     - `dist/bin/skillvault-win-x64.exe`
     - `dist/bin/skillvault-macos-x64`
     - `dist/bin/skillvault-macos-arm64`
     - `dist/bin/skillvault-linux-x64`
3. **Generar Wheels de Python**:
   - Copiar la estructura de `cli/python/` a carpetas temporales bajo `cli/dist/tmp/`.
   - Para el Wheel Universal:
     - Copiar `dist/skillvault.bundle.cjs` en `cli/dist/tmp/pure/skillvault/`.
     - Ejecutar `python -m build --wheel --outdir ../wheels/` dentro de `cli/dist/tmp/pure/`.
   - Para cada Plataforma Novedosa:
     - Copiar el binario correspondiente (renombrado a `skillvault-bin` o `skillvault-bin.exe`) en `cli/dist/tmp/<plataforma>/skillvault/`.
     - Generar el `.whl` usando `python -m build --wheel`.
     - Renombrar el `.whl` final para sobrescribir el tag `any` con el tag correspondiente de la plataforma (por ejemplo, `win_amd64`, `macosx_10_9_x86_64`, `manylinux2014_x86_64`).

---

## 5. Pipeline de CI/CD (`.github/workflows/release.yml`)
Un workflow que se activa en tags de release para construir y subir los artefactos:

```yaml
name: Release Artifacts

on:
  release:
    types: [created]

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install Node Dependencies
        run: |
          cd cli
          npm install

      - name: Install Python Packaging Tools
        run: pip install build

      - name: Run Build and Packaging Script
        run: |
          cd cli
          node build-dist.js

      - name: Upload Artifacts to Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            cli/dist/bin/*
            cli/dist/wheels/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 6. Plan de Pruebas
1. **Prueba de Ejecución Local**: Verificar que `node build-dist.js` genere los binarios y los archivos `.whl` correctos.
2. **Prueba del Wheel Universal**: Instalar localmente `pip install cli/dist/wheels/skillvault-*.any.whl` y comprobar que la ejecución con `node` funcione.
3. **Prueba de Wheels Nativos**: Instalar el Wheel nativo correspondiente al OS y verificar el funcionamiento sin requerir `node` instalado.
