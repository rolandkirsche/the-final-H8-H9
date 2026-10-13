#!/usr/bin/env python3
"""Baut aus src/ die auslieferbare Einzeldatei index.html.

    python3 build.py            # minifiziert (esbuild, falls vorhanden; sonst unminifiziert)
    python3 build.py --dev      # lesbar, ohne Minifizierung

Foto (assets/h9.webp) wird als data:-URI, CSS und JS (src/js/*.js in Dateinamen-Reihenfolge)
werden inline eingebettet. Ergebnis: eine Datei, die per Doppelklick (file://) oder auf
jedem statischen Webserver (z. B. GitHub Pages) läuft.
"""
import base64, glob, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
dev = "--dev" in sys.argv

def read(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()

def esbuild(code, loader):
    exe = shutil.which("esbuild")
    cmd = [exe] if exe else (["npx", "--no-install", "esbuild"] if shutil.which("npx") else None)
    if not cmd or dev: return code
    try:
        r = subprocess.run(cmd + ["--minify", "--loader=" + loader, "--target=safari14,chrome90,firefox90"],
                           input=code, capture_output=True, text=True, timeout=60)
        if r.returncode == 0 and r.stdout.strip(): return r.stdout
    except Exception: pass
    print("Hinweis: esbuild nicht verfügbar, %s bleibt unminifiziert" % loader, file=sys.stderr)
    return code

css = esbuild(read("src/style.css"), "css")
js = "\n".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(ROOT, "src/js/*.js"))))
js = esbuild(js, "js")
photo = "data:image/webp;base64," + base64.b64encode(open(os.path.join(ROOT, "assets/h9.webp"), "rb").read()).decode()

html = read("src/index.html")
html = html.replace("@@PHOTO@@", photo)
html = html.replace("/*@css*/", css.strip())
html = html.replace("/*@js*/", js.strip().replace("</script", "<\\/script"))
if not dev: html = re.sub(r"<!--(?!\[).*?-->", "", html, flags=re.S)
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)
print("index.html: %d Bytes (%s)" % (len(html.encode()), "dev" if dev else "minifiziert"))
