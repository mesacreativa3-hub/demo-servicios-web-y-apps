# Animaciones sutiles para la landing

## Implementación
- Ajustar la aparición al hacer scroll a 20 px, 500 ms y `ease-out`, ejecutándose una sola vez con `IntersectionObserver`.
- Aplicar la aparición a títulos, textos descriptivos y tarjetas, manteniendo intactos el contenido y la estructura de las secciones.
- Dar al bloque completo de título y subtítulo del inicio una entrada coordinada al cargar la página.
- Añadir a botones y tarjetas un aumento suave a `scale(1.03)` y una sombra ligeramente más intensa en 200 ms.
- Respetar la preferencia de movimiento reducido y conservar el comportamiento actual en dispositivos táctiles.

## Verificación
- Comprobar la carga inicial y el disparo único de las apariciones.
- Revisar visualmente escritorio y móvil, incluyendo desbordamientos y estabilidad del diseño.
- Confirmar que no aparecen errores y que no se añade ninguna librería de animación.

## Detalles técnicos
- Los cambios se limitarán al CSS y JavaScript nativo del documento de la landing.
- Se reutilizarán las clases existentes, separando la entrada inicial del inicio de las apariciones por scroll.
