# Frida Leal Barber

Sitio web de **Frida Leal Barber · Barbería Leal** (Izamal, Yucatán).
Una sola página, estática, construida con Vite + GSAP (ScrollTrigger, SplitText) + Lenis.

## Uso

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # versión de producción en dist/
npm run preview   # revisar la versión de producción
```

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html` | Todo el contenido: textos, servicios, horarios, enlaces, SEO |
| `src/style.css` | Sistema visual (paleta, tipografía, composición) |
| `src/main.js` | Animaciones GSAP, menú, visor de fotos, horario en vivo |
| `public/img/` | Fotos optimizadas (WebP + JPG) |
| `fotos-originales/` | Fotos fuente |
| `scripts/optimizar-imagenes.py` | Regenera `public/img/` desde las originales |

## Pendientes del negocio

Busca estos comentarios en `index.html`:

1. **Precios** — cada servicio muestra "Consultar". Sustituye el texto dentro de
   `<span class="service__price">` por el precio real.
2. **Fotos de cortes** — la galería tiene dos espacios marcados `ESPACIO TEMPORAL`.
   Coloca la foto en `public/img/` y reemplaza el bloque por un `<button class="shot__frame" …>`
   como los demás.
3. **Facebook** — el enlace del pie apunta a una búsqueda; cámbialo por la URL exacta de la página.
4. **Dominio** — al publicar, cambia `og:image` a la URL absoluta
   (ej. `https://tudominio.com/img/og.jpg`) para que la vista previa aparezca al compartir.

## Publicar

El sitio usa rutas relativas: la carpeta `dist/` funciona en cualquier hosting estático.

**Netlify o Vercel (recomendado, URL propia en minutos)**

1. Crea una cuenta y elige *Import from Git* → este repositorio.
2. Build command: `npm run build` · Output directory: `dist`.
3. Publica. Obtendrás una URL (`algo.netlify.app` / `algo.vercel.app`).
4. Para un dominio propio (ej. `fridalealbarber.com`): cómpralo y añádelo en *Domains*.

**GitHub Pages**

1. Fusiona esta rama en `main`.
2. En GitHub: *Settings → Pages → Source: GitHub Actions*.
3. El flujo `.github/workflows/pages.yml` publica el sitio en cada cambio a `main`.

**Sin cuenta de Git**: ejecuta `npm run build` y arrastra la carpeta `dist/` a
<https://app.netlify.com/drop>.
