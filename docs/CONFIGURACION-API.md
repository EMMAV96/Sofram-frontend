# URL de la API

El único punto de consumo de la URL base es `src/api/apiClient.ts`, mediante
`import.meta.env.VITE_API_BASE_URL`. Las APIs de cada módulo aportan solo rutas.
Vite carga las variables de entorno sin necesitar cambios en `vite.config.ts`.

## Desarrollo

Copiar `.env.example` a `.env` si aún no existe. Conservar el valor local del
ejemplo. Reiniciar Vite después de cambiar el entorno. `.env` está ignorado por
Git y no debe versionarse.

## Producción

En el servicio frontend de Render, definir `VITE_API_BASE_URL` con la URL pública
completa del backend, incluido el prefijo `/api/v1`, antes de ejecutar `pnpm build`.
No se fija aquí una dirección de Render. La variable del entorno de build tiene
prioridad sobre los archivos `.env`; no subir el archivo local al despliegue.

El valor queda incorporado al bundle: cualquier cambio requiere recompilar y
desplegar de nuevo. Una variable ausente o vacía bloquea la solicitud en el
cliente en lugar de enviarla al dominio del frontend. Los espacios exteriores
y barras finales se eliminan antes de unir la base con las rutas.

`VITE_API_BASE_URL` es pública y solo debe contener la URL de la API.
Nunca poner contraseñas, JWT secrets, tokens ni credenciales de base de datos
en variables `VITE_*`. No se cambia el flujo de autenticación ni el Bearer JWT.
