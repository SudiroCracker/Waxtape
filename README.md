# waxtape.

Tienda de mods cosméticos gratuitos para Reskate. Es una web estática: no tiene base de datos ni servidor, solo HTML, CSS y los archivos de cada prenda.

## Cómo funciona

```
catalog.json            ← el catálogo: categorías, prendas y producto destacado
public/                 ← todo lo que se publica tal cual
  fonts/  logos/
  products/<id>/        ← product.jpg, 01–04.jpg y el .zip de cada prenda
src/
  styles/tokens.css     ← colores, tipografías y espacios (sistema de diseño)
  styles/site.css       ← estilos de la web
  components/           ← piezas: cabecera, tarjeta, destacado, ficha, footer…
  pages/pages.mjs       ← qué páginas existen y qué llevan
build.mjs               ← genera la web en dist/
```

`node build.mjs` lee `catalog.json` y crea una página por ruta:

- Home.
- Una ficha por producto en `/products/<id>/`.
- Un listado por grupo y por categoría, por ejemplo `/apparel/tops/`.
- `/all/`, con el buscador de nombres y tags.
- Las páginas about, guide, ezine y 404.

Si falta una imagen o un .zip, la web no se rompe: el botón muestra "soon" y el build te lo avisa. Si `catalog.json` tiene un error, el build se para y te explica qué arreglar, y la web publicada no cambia.

## Ver la web en tu ordenador

Necesitas [Node.js](https://nodejs.org) 18 o superior. No hay que instalar nada más.

```
npm run dev       # genera la web y la abre en http://localhost:4321
npm run build     # solo genera dist/
```

## Añadir una prenda

Toda la guía paso a paso, hecha desde la web de GitHub y sin instalar nada, está en **[GUIA.md](GUIA.md)**.

En resumen, cada prenda es una carpeta `public/products/<id>/` con `product.jpg`, `01–04.jpg` y el `.zip`, más una entrada en `catalog.json`. El peso del .zip, las rutas de las imágenes y el nombre del .zip se leen solos de la carpeta.

## Publicar en Cloudflare Pages (gratis)

1. Entra en dash.cloudflare.com › Workers & Pages › Create › Pages › Connect to Git, y elige este repositorio.
2. Configura el proyecto:
   - Framework preset: **None**
   - Build command: **`node build.mjs`**
   - Build output directory: **`dist`**
3. Pulsa Deploy. La web queda en `https://waxtape.pages.dev`; el dominio propio es `https://waxtape.store` (Custom domains en Cloudflare Pages).

Cada cambio que subas a `main` se publica solo.

## Tipografías y licencias

- **Besley** (Owen Earl, Google Fonts): SIL Open Font License, libre para web. Alojada en `public/fonts/` (licencia en `Besley-OFL.txt`).
- **Drowner Free** (Hainz Studio): licencia de uso personal que permite uso online. Si Waxtape llega a tener ingresos (anuncios, donaciones, merch), compra la licencia comercial.
- El logotipo está en Adanda Pro, pero solo se usa como vector: no hace falta la fuente.
