# Frida Leal Barber

Sitio web de **Frida Leal Barber · Barbería Leal** (Izamal, Yucatán).
Una sola página, estática, construida con Vite + GSAP (ScrollTrigger, SplitText) + Three.js + Lenis.

La página se narra con el scroll: un poste de barbero 3D que se desenrolla en cintas, una esfera de
fotografías que se puede girar, una máquina en despiece, el menú de paquetes y un formulario que
arma el mensaje de WhatsApp.

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
| `src/main.js` | Líneas de tiempo GSAP, menú, visor de fotos, formulario, horario en vivo |
| `src/three/pole.js` | Poste 3D y cintas (hero) |
| `src/three/clipper.js` | Máquina en despiece |
| `src/sphere.js` | Esfera de fotografías |
| `public/img/` | Fotos optimizadas (WebP + JPG) |
| `fotos-originales/` | Fotos fuente |
| `scripts/optimizar-imagenes.py` | Regenera `public/img/` desde las originales |

## Pendientes del negocio

Busca estos comentarios en `index.html`:

1. **Precios** — están en la sección `SERVICIOS` de `index.html` y en el `<select name="paquete">`
   del formulario. Si cambian, actualiza ambos.
2. **Fotos de cortes** — la esfera usa 9 recortes de las dos fotos reales, repetidos. Para añadir
   fotos nuevas, agrégalas a `TILES` en `scripts/optimizar-imagenes.py` (o guarda cuadrados de 360 px
   como `public/img/esfera-N.webp`) y cambia el `src` de los botones `sphere__tile`.
3. **Facebook** — el enlace del pie apunta a una búsqueda; cámbialo por la URL exacta de la página.
4. **Dominio** — `og:url`, `og:image` y el `canonical` apuntan a
   `https://williamcode2009.github.io/Frileal-/`. Si usas otro dominio, cámbialos en `index.html`.

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
