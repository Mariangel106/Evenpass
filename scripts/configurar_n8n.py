"""Reemplaza los marcadores de los workflows por los IDs reales de tus Google Sheets y de WF09.

Uso:
    cp n8n/ids.example.json n8n/ids.json   # y completa los IDs
    python3 scripts/configurar_n8n.py

Escribe copias listas para importar en n8n/configurado/ (ignorada por git).
Los marcadores tienen la forma __EP01_USUARIOS_ID__ y __WF09_NOTIFICACIONES_ID__.
"""
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
N8N = RAIZ / "n8n"
DESTINO = N8N / "configurado"


def main():
    ruta_ids = N8N / "ids.json"
    if not ruta_ids.exists():
        sys.exit("Falta n8n/ids.json. Cópialo desde n8n/ids.example.json y completa los IDs.")
    ids = json.loads(ruta_ids.read_text(encoding="utf-8"))
    reemplazos = {}
    for clave, valor in ids.items():
        if not valor or valor.startswith("ID_DEL_"):
            sys.exit(f"Completa el ID de {clave} en n8n/ids.json.")
        marcador = "__WF09_NOTIFICACIONES_ID__" if clave == "WF09" else f"__{clave.upper()}_ID__"
        reemplazos[marcador] = valor

    DESTINO.mkdir(exist_ok=True)
    for archivo in sorted(N8N.glob("WF*.json")):
        texto = archivo.read_text(encoding="utf-8")
        for marcador, valor in reemplazos.items():
            texto = texto.replace(marcador, valor)
        pendientes = sorted({m for m in reemplazos if m in texto})
        (DESTINO / archivo.name).write_text(texto, encoding="utf-8")
        print(f"{archivo.name}: listo" + (f" (sin reemplazar: {pendientes})" if pendientes else ""))
    print(f"\nImporta los archivos de {DESTINO.relative_to(RAIZ)} en n8n (Workflows → Import from File).")


if __name__ == "__main__":
    main()
