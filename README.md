# Mesa Creativa Showcase

Quiero que crees una landing page en un solo archivo HTML (HTML + CSS + JS inline, sin dependencias externas salvo Google Fonts), pensada para funcionar como una "tarjeta de presentación digital" de alta gama que se comparte por WhatsApp. Debe verse como el sitio web de un estudio fotográfico premium, no como una plantilla genérica.

1. Sobre el negocio

Soy Mesa Creativa, un estudio especializado en fotografía y producción audiovisual para negocios gastronómicos y de producto (restaurantes, marcas de alimentación, packaging). Combino dirección de arte, food styling y técnica fotográfica avanzada. Mi servicio insignia y diferencial es el Focus Stacking: una técnica de apilamiento de enfoque que logra nitidez total de principio a fin en cada plato o producto, algo que la fotografía convencional no puede lograr en primeros planos y macro. Contacto: mesacreativa3@gmail.com. Ámbito: España.

2. Objetivo de la página
Debe poder enviarse como un link por WhatsApp y que la vista previa (thumbnail/título/descripción) se vea profesional → incluye metaetiquetas Open Graph (og:title, og:description, og:image, og:type=website) y Twitter Card completas, con textos ya redactados por ti.
Un botón flotante y otro en el hero de "Escríbeme por WhatsApp" que abra https://wa.me/ con un mensaje precargado tipo "Hola, vi tu portfolio y quiero información sobre una sesión de fotografía gastronómica".
100% responsive y priorizada para móvil, ya que la mayoría abrirá el link desde WhatsApp en el teléfono.
Carga rápida: imágenes con loading="lazy", sin librerías pesadas.
3. Dirección de arte / estilo visual
Estética editorial, cálida y sofisticada, como una revista de gastronomía de autor: tonos oscuros/carbón o crema profundo de fondo, con acentos dorados/cobre o verde oliva.
Tipografía: una serif elegante para titulares (estilo editorial, ej. "Fraunces", "Playfair Display" o similar de Google Fonts) combinada con una sans-serif limpia para el cuerpo (ej. "Inter" o "Manrope").
Mucho espacio en blanco/negativo, fotografía a pantalla completa, transiciones suaves al hacer scroll (fade-in / parallax sutil), nada de animaciones excesivas o "genéricas de IA".
Usa placeholders de imagen con 

 de degradados oscuros o picsum.photos/unsplash source como marcador temporal (yo subiré mis propias fotos y video después), pero deja comentado en el código dónde debo reemplazar cada imagen.
4. Estructura de secciones

A. Hero

Titular fuerte, ej: "Fotografía gastronómica que se saborea con la vista".
Subtítulo breve mencionando Mesa Creativa y el enfoque en negocios gastronómicos y de producto.
Botón CTA principal a WhatsApp y botón secundario "Ver servicios" (ancla a la sección de precios).
Imagen o video de fondo a pantalla completa (placeholder de un plato en primer plano, alta gama).

B. Sobre nosotros

2-3 frases: equipo especializado en producción fotográfica y audiovisual para negocios gastronómicos y de producto, combinando dirección de arte, food styling y técnica fotográfica avanzada, para contenido que funciona en redes sociales, cartas digitales, catálogos y tiendas online.

C. Servicio destacado: Focus Stacking

Explica en lenguaje claro y persuasivo (no técnico-frío) qué es el Focus Stacking y por qué requiere un tratamiento propio: se combinan varias tomas del mismo plato/producto, cada una enfocada en un plano distinto, logrando nitidez total desde el detalle más cercano hasta el fondo — la solución al límite físico de la óptica en macro y primeros planos.
Añade 3 iconos/bloques breves con el proceso: Captura (5–20 disparos por imagen, trípode fijo, óptica macro), Postproducción (alineado, fusión y retoque de textura/brillo/color), Resultado (nitidez imposible con una foto convencional).
Bloque "Cuándo se recomienda" con 3 tarjetas: platos y bebidas en primer plano, producto de detalle (packaging, piezas pequeñas), contenido de portada/catálogo/campaña.

D. Precios (tabla clara y elegante, no aburrida) Muestra estas tres filas como tarjetas o tabla estilizada:

Servicio	Precio
Fotografía de detalle con Focus Stacking (servicio independiente)	30 €/foto — incluye captura multi-enfoque, apilado y retoque final
Suplemento por foto adicional de detalle dentro de un pack de sesión	12 €/foto extra (a partir del límite incluido en cada pack)
Lote cerrado de fotografías de detalle (mínimo 10 uds.)	25 €/foto — tarifa reducida por volumen

Debajo, una segunda tabla más pequeña con los límites incluidos por pack de sesión:

Pack	Fotos de detalle incluidas	Suplemento desde
Esencial	Hasta 5 fotos	6ª foto
Profesional	Hasta 8 fotos	9ª foto
Premium	Hasta 12 fotos	13ª foto

Añade una nota pequeña: "Precios orientativos para el mercado español, sin IVA. Ámbito: España. El precio final se ajusta según volumen, complejidad y plazos."

E. Portfolio / Reel

Sección tipo galería con espacio para 4-6 fotos en grid asimétrico (estilo masonry) y un bloque destacado para incrustar un video (placeholder de reproductor con controles, aspecto 9:16 o 16:9) — yo subiré ahí mis vídeos de sesión.

F. Condiciones de trabajo

Lista breve en formato de iconos/checks: anticipo del 50% para reservar fecha, saldo contra entrega, cliente aporta el producto coordinado previamente, derechos de uso para fines comerciales (redes, web, portfolio), reprogramaciones con 48h de aviso.

G. Próximos pasos / CTA final

3 pasos numerados: 1) Confirmar número aproximado de fotos, 2) Agendar fecha o envío de producto, 3) Coordinar brief y referencias.
Botón grande final "Hablemos por WhatsApp".

H. Footer

Logo/nombre "Mesa Creativa", email mesacreativa3@gmail.com, y un texto pequeño "Propuesta válida 15 días desde su emisión" (opcional, discreto).
5. Requisitos técnicos finales
Un único archivo index.html autocontenido.
Botón flotante de WhatsApp fijo en la esquina inferior derecha, visible en todo el scroll.
Menú superior fijo (sticky) con anclas a: Servicio, Precios, Portfolio, Contacto.
Todo el texto debe estar ya redactado y listo, sin placeholders tipo "Lorem ipsum".
Comentarios en el código indicando dónde reemplazar imágenes/video por los archivos reales.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mesa-creative-portfolio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/26736a38-56f7-45c0-a05d-09675b0629c8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
