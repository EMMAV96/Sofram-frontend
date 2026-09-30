# Iteración visual 2

Presentación renovada sobre ETAPA-2 sin cambios de APIs, DTOs, permisos o consultas.

- Tokens institucionales, superficies verde/oliva/dorado, KPI con iconos y números destacados, leyendas y tooltips consistentes.
- Logo opcional: colocar el PNG circular oficial en `src/assets/branding/sofram-logo.png`. Build válido aunque no exista. No se genera un sustituto.
- Header cálido, sidebar institucional, Login refinado.
- Participantes en filas compactas con contenedor de 360 px máximo y scroll; acciones bajo demanda. Incorporación individual en modal con cupo real. No se introducen operaciones masivas.
- Asistencia en modal compacto. Estado conserva entrada libre porque el contrato no define un catálogo cerrado; no se inventan opciones. No se deduce “Pendiente” de asistencia=false.
- Fecha/hora y responsable de actividad siguen en el detalle donde ya se obtienen: no se agregan consultas por tarjeta.
- Historia clínica alineada al contenido y timeline de observaciones, sin horas, profesional ni especialidad ficticios.
- Selector con ficha compacta y acción Cambiar residente.
- Reglas responsive: KPI 1/2/5 columnas, actividades apiladas hasta desktop amplio, navegación drawer bajo 1024 px y participantes sin tabla ancha en móvil. Sin validación visual a 1920/1440/1024/768 px: no hay navegador conectado disponible en esta sesión.

Requiere backend: autor/profesional y especialidad de la evolución (y hora si se desea, dado que el contrato solo ofrece fecha). El logo faltante requiere un asset, no backend. Se conservan las demás limitaciones documentadas en ETAPA-2-UX.md.
