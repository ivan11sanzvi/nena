"""Junta index.html, styles.css y app.js en un solo archivo (vista-previa.html) para verla como artefacto de Claude.

Uso: python3 herramientas/vista_previa.py
"""
import pathlib
import re

raiz = pathlib.Path(__file__).resolve().parent.parent
index = (raiz / "index.html").read_text(encoding="utf-8")
css = (raiz / "styles.css").read_text(encoding="utf-8")
js = (raiz / "app.js").read_text(encoding="utf-8")

cuerpo = re.search(r"<!--APP-->(.*)<!--/APP-->", index, re.S).group(1)
html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>HYROXNENA</title>
<style>
{css}
</style>
</head>
<body>
{cuerpo.strip()}
<script>
{js}
</script>
</body>
</html>
"""
(raiz / "vista-previa.html").write_text(html, encoding="utf-8")
print("vista-previa.html:", len(html) // 1024, "KB")
