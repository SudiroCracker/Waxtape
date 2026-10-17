# Guía: añadir una prenda a waxtape.

Todo se hace desde la web de GitHub. No necesitas programar ni instalar nada.

Una prenda son **dos cosas**:

1. **Una carpeta con sus archivos** en `public/products/<id>/`.
2. **Una ficha de texto** en `catalog.json`.

Cuando guardas los cambios en GitHub, Cloudflare reconstruye la web y en uno o dos minutos la prenda aparece en la home, en su categoría, en el buscador y en "more like this".

---

## 1. Prepara los archivos en tu ordenador

Elige un **id** para la prenda. Es su nombre interno y forma parte de la dirección web, `waxtape.pages.dev/products/<id>/`.

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
| `category` | En apparel: `tops`, `bottoms`, `shoes`. En accessories: `eyewear`, `hats`, `socks`. En board: `deck`, `grip`, `trucks`, `wheels`, `stickers` |
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

- **Cambiar el producto destacado (THE RAW):** en `catalog.json`, dentro de `"featured"`:
  - `product` es el id de la prenda.
  - `title` es el título ("THE RAW").
  - `image` es la foto cuadrada 1:1, por ejemplo `"products/straight-teeth/04.jpg"`.
  - `text` es un texto propio. Si lo dejas en `null`, usa la descripción de la prenda.
- **Actualizar un mod:** sube el nuevo .zip a su carpeta. Si cambia de nombre, borra el viejo. Después sube `version` y `updated` en su ficha.
- **Quitar una prenda:** borra su bloque `{ … }` de `catalog.json`, junto con la coma que lo separa, y después su carpeta.
- **El fondo de azulejos** es `public/img/wall.jpg`. Sustitúyelo por otro con el mismo nombre.

## Cómo funciona la descarga en un clic

Cada .zip vive dentro de la propia web, en `public/products/<id>/`. Los botones "download" y ">>>DOWNLOAD NOW" son enlaces normales a ese archivo con el atributo `download`. Eso le dice al navegador que lo guarde directamente en vez de abrirlo. Sin páginas intermedias, sin Drive y sin avisos. Por eso los .zip no pueden quedarse en Google Drive: tienen que estar en la carpeta de la prenda.

## Logo animado (GIF) sobre THE RAW

1. Sube tu GIF a `public/img/` con el nombre exacto **`sticker.gif`** (en GitHub: entra en `public/img`, *Add file → Upload files*).
2. Tamaño de referencia: 471 × 265 px, fondo transparente (como en el Figma). La sombra la pone la web.
3. Al guardar, Cloudflare reconstruye la web y el GIF sustituye al logo rojo. Si borras el archivo, vuelve el logo rojo.
