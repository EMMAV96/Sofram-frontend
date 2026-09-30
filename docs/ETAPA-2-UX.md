# SOFRAM: segunda etapa de UX/UI

Cambios locales sobre el MVP etiquetado `v1.0.0-frontend-mvp`. No se modificó la etiqueta, no se hicieron commits ni push. No se modificaron APIs, DTOs ni backend.

## Implementado

- Paleta verde bosque, natural, oliva y dorado; tokens de estados, foco visible y movimiento reducido.
- Login con imagen institucional original, composición desktop 50/50, formulario prioritario en móvil, mostrar/ocultar contraseña y errores reales. Sin texto técnico de autenticación.
- Título y metadatos institucionales en español.
- Sidebar móvil, iconografía SVG uniforme sin dependencia nueva, perfil de consulta y username/rol reales. No se consulta Personal para obtener nombres de usuarios.
- ResidentSelector compartido en Historia Clínica, Gestión Médica, Participaciones y Reportes. Búsqueda local por palabras, tildes y DNI con separadores; resultados acotados con scroll, selección visible, flechas/Enter/Escape y estados vacíos/carga.
- Reporte clínico desde residente y ocupación desde Habitaciones. Se extrajo el hook existente de descarga para reutilizar JWT, Blob, errores, bloqueo de doble descarga y liberación de URL.
- Ficha de residente con navegación a módulos reales según permisos. Formularios médicos distribuidos en dos columnas con textos largos a ancho completo.
- Actividades con búsqueda local y listado compacto; asistencia Presente/Ausente, observaciones expandibles e incorporación con las mismas reglas de cupo, egreso y duplicados. Se conserva el tratamiento central de errores 409/422.
- Calendario usa “horario” en lugar de “detalle”; acento visual determinístico por tipo de actividad, sin persistencia ni cambio de DTO.
- Reportes y Auditoría con jerarquía orientada a la tarea. No se agregaron reportes ni datos de auditoría.
- Permisos actuales conservados: médico sin alta/edición administrativa de residentes ni Auditoría; TERAPISTA_OCUPACIONAL sin rol ficticio adicional.

## Identidad pendiente

Se necesita asset separado del logo circular.

Solo existe la imagen institucional completa en `src/imports`. Se reutiliza intacta en Login. Se retiró el SVG alternativo que simulaba el logo y se mantiene el nombre SOFRAM como texto. No se recortó por CSS ni se redibujó el emblema. La incorporación del logo circular en Login y sidebar queda pendiente del asset oficial independiente.

`/auth/me` solo aporta id, username, rol y empleadoId. El encabezado y Perfil muestran esos datos; no se inventa nombre de empleado ni se hacen solicitudes de Personal no autorizadas.

## REQUIERE MODIFICACIÓN BACKEND

1. Gestión de cuentas: crear/modificar usuarios, asignar login, cambiar contraseñas y vincular cuentas a empleados. No se agregaron credenciales a EmpleadoRequest.
2. PDF del listado de residentes: no existe en los contratos disponibles.
3. Separación del estado administrativo y condición clínica/cognitiva: requiere modelo y contrato nuevos. No se reutilizó estadoActual para información clínica.
4. Profesional autor en DetalleHistoriaClinicaResponse: el contrato disponible solo contiene id, historiaClinicaId, fecha y observaciones.
5. Elección y persistencia de color por actividad: ActividadRequest/Response no contienen color.
6. Eliminar actividad: no existe DELETE en la API integrada.
7. Observación/evaluación posterior de la actividad como entidad propia: no existe contrato. Las observaciones de una participación no se reinterpretan como evaluación global de actividad.
8. Nuevo rol TALLERISTA o cambios de permisos incompatibles con los actuales: requieren autorización backend. Se conserva TERAPISTA_OCUPACIONAL.
9. Logo y cambios de contenido en PDFs: se generan en backend. React descarga los bytes recibidos sin alterarlos.

Los puntos anteriores se basan en los contratos frontend disponibles y las instrucciones del usuario; no se modificó ni se inspeccionó SecurityConfig en otro proyecto.

## Validación

TypeScript y build de producción ejecutados. Verificaciones focalizadas del selector, permisos y reutilización de descargas. No hay navegador conectado disponible para una comprobación visual ni se realizaron operaciones reales de escritura contra backend.

Antes de publicar: revisar Login, navegación móvil, teclado del selector y los flujos autenticados con cada rol en navegador; incorporar el logo circular oficial. No se publicaron estos cambios.
