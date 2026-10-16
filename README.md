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

Si falta una imagen o un .zip, la web no se rompe: el botón muestra "soon" y el build te lo avisa.

## Ver la web en tu ordenador

Necesitas [Node.js](https://nodejs.org) 18 o superior. No hay que instalar nada más.

```
npm run dev       # genera la web y la abre en http://localhost:4321
npm run build     # solo genera dist/
```

## Añadir una prenda

1. Crea la carpeta `public/products/<id>/`. El `<id>` va en minúsculas y con guiones, por ejemplo `skull-hoodie`.
2. Dentro pon `product.jpg` (la miniatura, 800 × 1000), `01.jpg` a `04.jpg` (las fotos de modelo) y el `.zip` del mod.
3. Añade una entrada en `products` de `catalog.json`. Puedes copiar una existente y cambiar:
   - `id`, `name`, `description` y `tags`.
   - `group`, `category` y `type`. Deben existir en `taxonomy`: por ejemplo `apparel` › `tops` › `tshirt`.
   - `size`, que es el peso del .zip tal como quieres que se lea ("2.8 MB").
   - `thumb` y `download`, con las rutas dentro de `public/`.
   - `collab`, solo si es una colaboración ("Ed Hardy"). Si no, `null`.
4. Guarda y sube los cambios a GitHub. Cloudflare publica la web nueva en un par de minutos.

**Producto destacado (THE RAW):** se cambia en `featured` dentro de `catalog.json`. `image` es la foto cuadrada (1:1). Mientras no exista ese archivo, se usa la miniatura del producto.

## Publicar en Cloudflare Pages (gratis)

1. Entra en dash.cloudflare.com › Workers & Pages › Create › Pages › Connect to Git, y elige este repositorio.
2. Configura el proyecto:
   - Framework preset: **None**
   - Build command: **`node build.mjs`**
   - Build output directory: **`dist`**
3. Pulsa Deploy. La web queda en `https://waxtape.pages.dev`, o en el nombre que elijas.

Cada cambio que subas a `main` se publica solo.

## Tipografías y licencias

- **Satoshi** (Indian Type Foundry, Fontshare): Free Font License, uso comercial y web permitido.
- **Drowner Free** (Hainz Studio): licencia de uso personal que permite uso online. Si Waxtape llega a tener ingresos (anuncios, donaciones, merch), compra la licencia comercial.
- El logotipo está en Adanda Pro, pero solo se usa como vector: no hace falta la fuente.
