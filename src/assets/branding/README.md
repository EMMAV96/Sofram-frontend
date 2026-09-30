# Logo oficial

Colocar el emblema circular oficial, sin la imagen panorámica, en:

`src/assets/branding/sofram-logo.png`

Logo.tsx lo detecta mediante import.meta.glob. Si no existe, no se muestra ninguna imagen sustitutiva ni se rompe el build. El nombre SOFRAM permanece como denominación institucional, no como emblema. Al añadir el PNG se utiliza en Login y sidebar; no se recorta ni se redibuja.
