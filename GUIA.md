# Guía: añadir una prenda a waxtape.

Todo se hace desde la web de GitHub. No necesitas programar ni instalar nada.

Una prenda son **dos cosas**:

1. **Una carpeta con sus archivos** en `public/products/<id>/`.
2. **Una ficha de texto** en `catalog.json`.

Cuando guardas los cambios en GitHub, Cloudflare reconstruye la web y en uno o dos minutos la prenda aparece en la home, en su categoría, en el buscador y en "more like this".

---

## 1. Prepara los archivos en tu ordenador

Elige un **id** para la prenda. Es su nombre interno y forma parte de la dirección web, `waxtape.store/products/<id>/`.

- Va en minúsculas, sin espacios ni tildes, con guiones: `skull-hoodie`, `cropped-hokki`.
- No se puede repetir y conviene no cambiarlo nunca, porque cambiaría la dirección.

Prepara estos archivos:

| Archivo | Qué es | Formato |
|---|---|---|
| `product.jpg` | La miniatura del listado, sobre fondo blanco | 800 × 1000 px, JPG |
| `01.jpg` `02.jpg` `03.jpg` `04.jpg` | Las fotos de modelo para la galería | JPG, verticales 4:5 |
| `Wt_Nombre.zip` | El mod que se descarga | .zip, el nombre que quieras |

- Las fotos 01–04 son opcionales: si faltan, la ficha enseña solo la miniatura.
- Si no hay .zip, el botón dice "soon".
- **Peso máximo por archivo: 25 MB.** Es el límite de Cloudflare y de la subida web de GitHub. Las fotos deberían pesar menos de 400 KB: exporta en JPG con calidad 75–80.
- Las tarjetas usan copias pequeñas de las fotos (`product-400.webp`, `product-600.webp`, `01-600.webp`…). Las crea `python3 tools/thumbs.py`; si faltan, la web usa la foto original y el build lo avisa en "heads up". No hace falta subirlas a mano.

## 2. Sube la carpeta a GitHub

1. Abre el repositorio en github.com y entra en `public` › `products`.
2. Pulsa **Add file › Upload files**.
3. Arrastra **la carpeta entera** (por ejemplo `skull-hoodie`, con sus archivos dentro). GitHub conserva la carpeta.
4. Abajo, en *Commit changes*, escribe un mensaje corto, como `Add skull hoodie files`, y pulsa **Commit changes**.

Para cambiar una foto, sube un archivo con el mismo nombre en la misma carpeta y GitHub lo sustituye.

## 3. Añade la ficha en catalog.json

1. Abre `catalog.json` en el repositorio y pulsa el **lápiz** (Edit this file).
2. Busca la última prenda de la lista `"products"`. Termina en `}`.
3. Escribe una **coma** justo después de esa `}` y pega debajo esta plantilla:

```json
    {
      "id": "skull-hoodie",
      "name": "Skull Hoodie",
      "collab": null,
      "group": "apparel",
      "category": "tops",
      "type": "jacket",
      "tags": ["black", "heavyweight", "skull", "90s"],
      "description": "Two or three short lines about the piece and its graphic. End with a joke if it fits.",
      "uploaded": "2026-10-18",
      "updated": "2026-10-18",
      "version": "1.0.0"
    }
```

4. Cambia los valores. Lo que va entre comillas a la izquierda de los dos puntos no se toca. Mira la chuleta de abajo.
5. Pulsa **Commit changes**.

### Chuleta de campos

| Campo | Qué poner |
|---|---|
| `id` | Igual que el nombre de la carpeta |
| `name` | El nombre visible. En las tarjetas sale todo junto ("SkullHoodie") y en la ficha en minúsculas ("skull hoodie") |
| `collab` | `null` si es solo Waxtape. Si es colaboración, la marca entre comillas: `"Ed Hardy"` |
| `group` | `apparel`, `accessories` o `board` |
| `category` | En apparel: `tops`, `bottoms`, `shoes`, `accessories` (gafas, gorras y calcetines van todos en `accessories`, con `type` `eyewear`, `hats` o `socks`). En board: `deck`, `grip`, `trucks`, `wheels`, `stickers` |
| `type` | En tops: `bra`, `coat`, `jacket`, `tshirt`. En bottoms: `pants`, `shorts` |
| `tags` | 4 a 7 palabras en minúsculas: color, corte, gráfico y época. Alimentan el buscador y "more like this" |
| `description` | 2 o 3 frases en inglés. Si necesitas comillas dentro del texto, escríbelas como `\"` |
| `material` | Opcional. Se muestra en el destacado: `"material": "100% Cotton",` |
| `uploaded` | La fecha de alta, año-mes-día. Las más recientes salen primero en NEW!!! |
| `updated` | La fecha de la última versión del mod |
| `version` | Súbela cuando cambies el .zip: `1.0.1`, `1.1.0`… |

**No hace falta escribir** el peso del .zip, las rutas de las imágenes ni el nombre del .zip: la web los lee de la carpeta.

## 4. Comprueba que se ha publicado

- En GitHub, al lado del último commit, aparece un círculo amarillo y después un ✓ verde. El ✓ significa que Cloudflare ha publicado. Una ✗ roja significa que algo falló.
- Abre la web y busca la prenda en la home o en `/all/`.

### Si sale la ✗ roja

Casi siempre es un error de escritura en `catalog.json`. Pulsa la ✗ › *Details* y lee el mensaje. La web te dice qué pasa:

- **`catalog.json has a mistake`**: falta una coma entre dos prendas, sobra una coma después de la última `}`, o falta una comilla.
- **`category "x" is not in apparel`**: hay un valor mal escrito en `group` o `category`. El mensaje te lista los valores válidos.
- **`there is no folder public/products/<id>/`**: el `id` no coincide con el nombre de la carpeta.

Mientras haya un error, la web publicada sigue siendo la anterior, así que nunca se queda rota.

---

## Otras tareas habituales

- **El destacado (THE RAW) se elige solo:** en cada visita sale al azar una de las **2 prendas más recientes** (por fecha `uploaded`; si empatan, la que está más arriba en `catalog.json`), con una de sus fotos 01–04 recortada en cuadrado. Al hacer clic lleva a la página de esa prenda. No hay que tocar nada al subir prendas nuevas. En `"featured"` solo quedan `title` (el titular, "THE RAW") y `pool` (cuántas prendas recientes entran en el sorteo, ahora 2).
- **Actualizar un mod:** sube el nuevo .zip a su carpeta. Si cambia de nombre, borra el viejo. Después sube `version` y `updated` en su ficha.
- **Quitar una prenda:** borra su bloque `{ … }` de `catalog.json`, junto con la coma que lo separa, y después su carpeta.
- **El fondo de azulejos** es `public/img/wall.jpg`. Sustitúyelo por otro con el mismo nombre.

## Cómo funciona la descarga en un clic

Cada .zip vive dentro de la propia web, en `public/products/<id>/`. El botón "download" de la página de producto es un enlace normales a ese archivo con el atributo `download`. Eso le dice al navegador que lo guarde directamente en vez de abrirlo. Sin páginas intermedias, sin Drive y sin avisos. Por eso los .zip no pueden quedarse en Google Drive: tienen que estar en la carpeta de la prenda.

## Logo animado (GIF) sobre THE RAW

1. Sube tu GIF a `public/img/` con el nombre exacto **`sticker.gif`** (si además hay un `sticker.webp`, la web sirve primero el WebP, que pesa mucho menos; si cambias el GIF, borra o sustituye también el WebP) (en GitHub: entra en `public/img`, *Add file → Upload files*).
2. Fondo transparente y ya inclinado: la web no lo rota. La sombra la pone la web. Intenta que pese menos de 2 MB.
3. Al guardar, Cloudflare reconstruye la web y el GIF sustituye al logo rojo. Si borras el archivo, vuelve el logo rojo.


## Novedades (18 oct)

- **Imágenes en WebP:** las fotos de producto y la pared ya son `.webp` (pesan ~70 % menos). Para prendas nuevas puedes subir `.jpg`, `.png` o `.webp`: la web acepta los tres.
- **Secciones bloqueadas:** si un grupo (accessories, board) no tiene prendas, sale tachado en el menú y en el footer y no se puede pulsar. En cuanto añadas la primera prenda de ese grupo, se desbloquea solo.
- **Filtros:** en apparel, accessories, board y all mods aparecen chips de TYPE y COLOUR (salen solos de las etiquetas y del tipo de cada prenda; una fila solo aparece si hay al menos 2 opciones) y SORT (newest / a–z). Se combinan con el buscador. Los colores se reconocen si la etiqueta es uno de estos: black, white, off-white, cream, grey, charcoal, red, pink, orange, yellow, green, blue, navy, purple, brown.
- **Compatibilidad:** la ficha muestra WORKS WITH con el valor de `site.game` en catalog.json (ahora "ReSkate 2.0.7+").
- **Thunderstore en cada ficha:** enlace al paquete y número de descargas. El paquete se busca con tu usuario (`site.thunderstore.namespace`) y el nombre del zip. Si en Thunderstore se llama distinto, añade a la prenda `"thunderstore": "NombreExacto"`. El número se actualiza cada vez que la web se publica.
- **Imagen para compartir:** sube `public/img/og.jpg` (1200 × 630) y será la vista previa de la home y las páginas generales en Discord, WhatsApp, X… Las fichas de producto usan su propia foto.
- **sitemap.xml y robots.txt** se generan solos en cada publicación.

## Contador de descargas (18 oct)

- **DOWNLOADS** en cada ficha = descargas en Thunderstore + descargas desde la web.
- Thunderstore se consulta desde Cloudflare y se guarda 1 hora: el número nunca tiene más de una hora de retraso. No hace falta publicar para que se actualice.
- Las descargas de la web se cuentan al pulsar "download" y se guardan en una base de datos D1 de Cloudflare llamada `waxtape`, conectada al proyecto como `DB`. Sin esa conexión la web funciona igual y solo suma Thunderstore.
- El código está en `functions/api/` (lo ejecuta Cloudflare Pages, no hay que configurarlo).
- Thunderstore no permite que otras webs sumen descargas a su contador: la suma se muestra en waxtape, no en Thunderstore.

## Marco de la imagen grande

La foto grande de cada ficha va dentro de `public/img/ornaments/frame-tall.webp` (832 × 1040, ventana interior 752 × 954). Las tarjetas y miniaturas mantienen el trazo de tinta.

## Navegación nueva (18 oct)

- Menú: **apparel · board · ezine · about**. La home se abre con el logo.
- **Accessories** ya no es una sección aparte: es una categoría más de apparel (`"group": "apparel", "category": "accessories"`). `/accessories/` redirige a `/apparel/accessories/`.
- En apparel, el filtro TYPE muestra **top · bottom · shoes · accesories** con su número; las vacías salen tachadas. `/apparel/tops/` abre la lista con "top" ya marcado.
- SORT: **newest · a–z · colour**. "colour" ordena por la primera etiqueta de color de cada prenda: black, charcoal, grey, white, off-white, cream, brown, red, pink, orange, yellow, green, blue, navy, purple.
- La guía de instalación está dentro de **about** (`/about/#install`); `/guide/` redirige ahí. Las redirecciones están en `public/_redirects`.

## Dominio waxtape.store (18 oct)

- La web vive en **https://waxtape.store**. `waxtape.pages.dev` y `www.waxtape.store` redirigen ahí (301) conservando la ruta: lo hace `functions/_middleware.js`.
- El dominio está conectado en Cloudflare Pages → waxtape → Custom domains. Los registros DNS (dos CNAME y el TXT de Google) están en la zona waxtape.store. **No borres el TXT `google-site-verification`**: es lo que mantiene la propiedad en Search Console.
- Search Console: propiedad de dominio `waxtape.store`, verificada por DNS, con `sitemap.xml` enviado.
- Los manifest de los zips ya apuntan a waxtape.store; las copias para Thunderstore están actualizadas.

## Bloqueos de LaLiga (18 oct)

Durante los partidos, los operadores españoles bloquean rangos de IP compartidos de Cloudflare y la web dejaba de cargar en España.
Por eso los dos CNAME de waxtape.store (raíz y www) están en **DNS only** (nube gris), no en Proxied: así la web se sirve desde
las IPs de Cloudflare Pages, que no entran en esos bloqueos. **No vuelvas a activar el proxy** en esos registros.
Cloudflare mostrará un aviso amarillo recomendando el proxy: se puede cerrar.

## Exclusivos de waxtape.store (19 oct)

Si una prenda no está (o no puede estar) en Thunderstore, añade a su ficha en catalog.json:
`"thunderstore": false`. La ficha deja de enlazar al paquete, muestra **EXCLUSIVE · Only on waxtape.store**
y el contador DOWNLOADS cuenta solo las descargas de la web.
Ahora mismo: ninguno (todos los mods están publicados en Thunderstore).

## Variantes de producto (otro corte o color de la misma prenda)

1. Crea `public/products/<id>/variants/<variante>/` con `product.webp` (foto Product) y el `.zip` de la variante (un mod independiente, con su manifest/icon/README).
2. En la entrada del catálogo añade el nombre de la versión base y la lista de variantes:
   ```json
   "variant": "Cropped",
   "variants": [ { "id": "relaxed-fit", "name": "Relaxed Fit", "version": "1.0.0", "uploaded": "2026-10-19" } ]
   ```
3. Las tarjetas muestran `+N` a la derecha del nombre. En la página del producto aparece la fila VARIANT sobre el botón download: cada miniatura cambia el zip, VERSION, FILE, UPDATED y la imagen principal.
4. Cada variante cuenta sus descargas aparte (web + Thunderstore); DOWNLOADS muestra la suma. El enlace de Thunderstore de una variante solo aparece cuando su paquete ya existe allí (se comprueba en cada build). `"thunderstore": false` en la variante la deja como exclusiva.

## Spotted (fotos de la comunidad)

- Las fotos van en `public/spotted/` (WebP, idealmente 1600 px de ancho, horizontales 16:10).
- En `catalog.json`, la lista `"spotted"` lleva una entrada por foto:
  ```json
  { "img": "spotted/2026-10-23-nombre.webp", "player": "nombre", "items": ["maji-chino"], "date": "2026-10-23", "caption": "opcional" }
  ```
- La home muestra las 4 más recientes bajo THE RAW (los huecos vacíos dicen «your shot»). La página completa está en `/spotted/`, con enlace a cada item que lleva puesto.
- Interruptor: `"showSpotted": false` en `site` (catalog.json) oculta el panel de la home, el enlace del pie y la entrada del sitemap. La página /spotted/ sigue existiendo sin enlazar.

## Customs (items pedidos por jugadores)

- Añade `"requestedBy": "usuario"` a la ficha en `catalog.json` (sin la @).
- La ficha muestra «-requested by @usuario-» bajo la descripción, y el item aparece también al filtrar por **CUSTOMS** en items y en su sección (el chip solo sale si hay alguno en esa página). Buscar «customs» o el nombre del usuario también lo encuentra.
- En el manifest de Thunderstore, la descripción lleva «-requested by @usuario-» antes de «waxtape․store online».
- `"hidden": true` en una ficha la deja fuera de la web (listas, ficha, sitemap y contador) sin borrar sus archivos. Quítalo para publicarla.
