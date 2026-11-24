"""Optimiza las imágenes de public/media para que la web cargue rápido.

- Fotos de platos y productos (nombre que empieza por "demo-" o "producto-"): máximo 1200 px por lado.
- Resto de imágenes (portadas, galería): máximo 1920 px por lado.
- JPG: calidad 82, progresivo, sin datos EXIF (respeta la orientación de la foto).
- Si un JPG sigue pesando más de 350 KB, baja la calidad poco a poco (hasta 72).
- PNG y WebP: solo se reducen de tamaño y se comprimen sin perder calidad visible.
- Una imagen ya optimizada no se vuelve a tocar, así que no pierde calidad con el tiempo.

Uso: python scripts/optimizar_imagenes.py public/media
"""
import io
import os
import sys

from PIL import Image, ImageOps

LADO_PRODUCTO = 1200
LADO_GENERAL = 1920
MAX_KB = 350
EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}


def lado_maximo(nombre):
    n = nombre.lower()
    return LADO_PRODUCTO if n.startswith(("demo-", "producto-")) else LADO_GENERAL


def guardar(img, formato, **opciones):
    buf = io.BytesIO()
    img.save(buf, formato, **opciones)
    return buf.getvalue()


def optimizar(ruta):
    nombre = os.path.basename(ruta)
    ext = os.path.splitext(nombre)[1].lower()
    peso = os.path.getsize(ruta)
    limite = lado_maximo(nombre)

    with Image.open(ruta) as original:
        ancho, alto = original.size
        if max(ancho, alto) <= limite and peso <= MAX_KB * 1024:
            return None  # ya está bien
        icc = original.info.get("icc_profile")
        img = ImageOps.exif_transpose(original)
        img.load()

    if max(img.size) > limite:
        img.thumbnail((limite, limite), Image.LANCZOS)

    if ext in (".jpg", ".jpeg"):
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        datos = None
        for calidad in (82, 78, 75, 72):
            opciones = dict(quality=calidad, optimize=True, progressive=True)
            if icc:
                opciones["icc_profile"] = icc
            datos = guardar(img, "JPEG", **opciones)
            if len(datos) <= MAX_KB * 1024:
                break
    elif ext == ".png":
        datos = guardar(img, "PNG", optimize=True)
    else:  # .webp
        datos = guardar(img, "WEBP", quality=80, method=6)

    redimensionada = img.size != (ancho, alto)
    if not redimensionada and len(datos) >= peso:
        return None  # no se gana nada: se deja como estaba

    with open(ruta, "wb") as f:
        f.write(datos)
    return (nombre, (ancho, alto), img.size, peso, len(datos))


def main(carpeta):
    cambios = []
    for raiz, _, archivos in os.walk(carpeta):
        for nombre in sorted(archivos):
            if os.path.splitext(nombre)[1].lower() in EXTENSIONES:
                try:
                    r = optimizar(os.path.join(raiz, nombre))
                except Exception as e:  # una imagen dañada no detiene a las demás
                    print(f"AVISO  {nombre}: no se pudo procesar ({e})")
                    continue
                if r:
                    cambios.append(r)
    if not cambios:
        print("Todas las imágenes ya estaban optimizadas.")
        return
    antes = sum(c[3] for c in cambios)
    despues = sum(c[4] for c in cambios)
    for n, (w0, h0), (w1, h1), p0, p1 in cambios:
        print(f"OK  {n}: {w0}x{h0} -> {w1}x{h1}, {p0 // 1024} KB -> {p1 // 1024} KB")
    print(f"Total: {len(cambios)} imágenes, {antes // 1024} KB -> {despues // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/media")
