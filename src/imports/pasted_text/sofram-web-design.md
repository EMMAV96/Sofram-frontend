Diseña la interfaz web completa de SOFRAM – Sistema de Residencia de Adultos Mayores.

IMPORTANTE:
Adjunto la imagen oficial de identidad visual de SOFRAM.

Debes utilizar esta imagen como referencia principal de marca.

NO rediseñar el logo.
NO cambiar su identidad visual.

El sistema ya posee un backend REST API terminado, desarrollado con:

- Java 21
- Spring Boot
- JWT
- arquitectura monolito modular
- MySQL
- Swagger/OpenAPI

Por lo tanto, NO inventes funcionalidades que no estén contempladas en esta especificación.

El diseño debe estar preparado para posteriormente implementar un frontend real y conectarlo a esta API.

==================================================
1. IDENTIDAD VISUAL
==================================================

Tomar como referencia la imagen adjunta de SOFRAM.

Identidad:

- verde oscuro como color institucional principal;
- verde oliva y verde claro como colores secundarios;
- dorado como color de acento;
- blanco / crema muy claro como fondos;
- grises suaves para superficies secundarias.

El sistema debe transmitir:

- cuidado;
- salud;
- tranquilidad;
- confianza;
- profesionalismo;
- claridad.

Evitar:

- apariencia hospitalaria fría;
- exceso de colores;
- degradados exagerados;
- interfaces infantiles;
- exceso de decoración;
- fondos visualmente cargados dentro de las pantallas operativas.

El logo circular de SOFRAM debe utilizarse principalmente en:

- Login
- Sidebar
- encabezados institucionales cuando corresponda.

La interfaz operativa debe ser limpia y moderna.

==================================================
2. TIPO DE APLICACIÓN
==================================================

Diseñar una aplicación web administrativa responsive para escritorio
como prioridad.

Resolución principal:
1440 px desktop.

Debe adaptarse posteriormente a tablet.

No diseñar todavía aplicación móvil para familiares.

==================================================
3. ESTRUCTURA GENERAL
==================================================

Usar:

SIDEBAR IZQUIERDO FIJO

con logo SOFRAM en la parte superior.

Opciones según permisos:

- Dashboard
- Residentes
- Habitaciones
- Historia Clínica
- Gestión Médica
- Personal
- Calendario
- Actividades
- Reportes
- Auditoría

TOPBAR:

- título de pantalla;
- usuario autenticado;
- rol;
- menú de usuario;
- cerrar sesión.

ÁREA PRINCIPAL:

- breadcrumbs cuando aporten claridad;
- título;
- descripción breve;
- acciones principales;
- filtros;
- tablas;
- formularios;
- tarjetas;
- indicadores.

==================================================
4. LOGIN
==================================================

Diseñar pantalla de inicio de sesión.

Utilizar fuertemente la identidad visual de la imagen adjunta.

Campos:

Usuario
Contraseña

Botón:

Iniciar sesión

Mostrar logo SOFRAM claramente.

Debe verse institucional, elegante y simple.

Backend:

POST /auth/login

Después del login el backend devuelve JWT.

==================================================
5. ROLES DEL SISTEMA
==================================================

La interfaz debe estar preparada para mostrar u ocultar opciones según:

ADMINISTRADOR
ADMINISTRATIVO
MEDICO
PSICOLOGO
LIC_ENFERMERIA
ENFERMERO
TERAPISTA_OCUPACIONAL

No inventar nuevos roles.

El frontend posteriormente deberá respetar los permisos del backend.

==================================================
6. DASHBOARD
==================================================

Diseñar Dashboard principal.

Debe estar preparado para mostrar indicadores como:

- Residentes activos
- Ocupación general
- Habitaciones disponibles
- Personal activo
- Actividades programadas

IMPORTANTE:

Estos indicadores forman parte del diseño previsto para una ampliación
del backend y pueden utilizarse como placeholders visuales en Figma.

NO inventar datos reales.

Agregar gráficos simples y profesionales como propuesta visual:

- ocupación de habitaciones;
- residentes por estado;
- actividades;
- distribución general.

Los gráficos deben respetar verde/dorado de SOFRAM.

==================================================
7. RESIDENTES
==================================================

Pantalla:

Listado de residentes.

Tabla con:

- Nombre y apellido
- DNI
- Habitación
- Estado
- Fecha de ingreso
- Obra social
- Acciones

Acciones:

Ver
Editar
Cambiar estado

Botón:

Nuevo residente

API existente:

GET /residentes
POST /residentes
GET /residentes/{id}
PUT /residentes/{id}
PUT /residentes/{id}/estado
GET /residentes/{id}/historial-estados

==================================================
8. PERFIL DEL RESIDENTE
==================================================

Crear una pantalla de detalle del residente.

Encabezado:

Nombre completo
DNI
Estado
Habitación

Organizar mediante tabs:

DATOS PERSONALES
HISTORIA CLÍNICA
GESTIÓN MÉDICA
ACTIVIDADES
HISTORIAL

Datos personales:

- nombre;
- apellido;
- DNI;
- fecha de nacimiento;
- dirección;
- teléfono;
- email;
- teléfono de emergencia;
- familiar a cargo;
- obra social;
- fecha de ingreso;
- fecha de egreso;
- habitación;
- estado.

Agregar acción visible para usuarios autorizados:

Descargar reporte clínico PDF.

==================================================
9. HABITACIONES
==================================================

Pantalla de gestión de habitaciones.

Mostrar tarjetas o tabla con:

- Número
- Tipo
- Estado
- Capacidad
- Ocupación actual
- Cupos disponibles

Utilizar indicadores visuales claros para:

Disponible
Ocupada / completa
Fuera de servicio u otros estados existentes

API:

GET /habitaciones
POST /habitaciones
GET /habitaciones/{id}
PUT /habitaciones/{id}

Agregar:

Descargar reporte de ocupación PDF

para perfiles autorizados.

==================================================
10. HISTORIA CLÍNICA
==================================================

Pantalla integrada al residente.

Mostrar:

- fecha de creación;
- observaciones;
- antecedentes personales;
- antecedentes familiares;
- alergias.

Crear sección:

Evolución clínica

con timeline o cards cronológicas.

Cada detalle puede mostrar:

Fecha
Observaciones

API:

POST /historias-clinicas
GET /historias-clinicas/{id}
GET /historias-clinicas/residente/{residenteId}
POST /historias-clinicas/{historiaClinicaId}/detalles
GET /historias-clinicas/{historiaClinicaId}/detalles
PUT /historias-clinicas/{id}/antecedentes-alergias

==================================================
11. GESTIÓN MÉDICA
==================================================

Diseñar dentro del contexto del residente.

Crear secciones/tabs:

ATENCIONES
EVALUACIONES
DIAGNÓSTICOS
TRATAMIENTOS
MEDICACIÓN

Atención médica:

- fecha;
- profesional;
- motivo;
- tipo de intervención;
- observaciones.

Evaluación:

- tipo;
- descripción;
- plan de intervención.

Diagnóstico:

- descripción.

Tratamiento:

- nombre;
- descripción.

Medicación:

- nombre;
- dosis;
- frecuencia.

Usar formularios mediante modal o drawer cuando resulte apropiado.

==================================================
12. PERSONAL
==================================================

Pantalla:

Gestión del personal.

Tabla:

- Nombre
- Apellido
- DNI
- Cargo
- Teléfono
- Email
- Estado
- Acciones

Acciones:

Ver
Editar
Dar de baja
Gestionar turnos

Secciones adicionales:

Cargos
Turnos
Asignaciones de turno

API existente:

GET/POST /personal/empleados
GET/PUT /personal/empleados/{id}
PATCH /personal/empleados/{id}/baja
GET/POST /personal/cargos
GET/POST /personal/turnos
GET/POST /personal/empleados/{empleadoId}/asignaciones-turno

==================================================
13. CALENDARIO
==================================================

Diseñar vista mensual/semanal.

Mostrar actividades programadas.

Debe permitir navegar visualmente por:

Mes
Semana
Día

Mostrar:

- actividad;
- horario;
- responsable.

API:

GET/POST /calendarios
GET /calendarios/{id}
GET/POST /calendarios/{calendarioId}/detalles
GET /calendarios/detalles/{id}

==================================================
14. ACTIVIDADES
==================================================

Pantalla de actividades.

Mostrar:

- actividad;
- fecha/horario;
- responsable;
- participantes;
- asistencia.

Permitir:

Crear actividad
Ver actividad
Gestionar participantes
Registrar asistencia

API:

GET/POST /actividades
GET /actividades/{id}
GET /actividades/detalle-calendario/{detalleCalendarioId}
GET /actividades/empleado/{empleadoId}

POST /participaciones-actividades
GET /participaciones-actividades/{id}
GET /participaciones-actividades/actividad/{actividadId}
GET /participaciones-actividades/residente/{residenteId}
PUT /participaciones-actividades/{id}/asistencia

==================================================
15. REPORTES
==================================================

Crear pantalla central:

REPORTES

Cards:

REPORTE CLÍNICO INDIVIDUAL

Seleccionar residente
Descargar PDF

Endpoint:

GET /reportes/clinico/residentes/{residenteId}/pdf

Disponible para:

ADMINISTRADOR
MEDICO


REPORTE DE OCUPACIÓN

Mostrar resumen:

Habitaciones
Capacidad total
Ocupación
Cupos disponibles
Porcentaje de ocupación

Botón:

Descargar PDF

Endpoint:

GET /reportes/ocupacion/pdf

Disponible para:

ADMINISTRADOR
ADMINISTRATIVO

==================================================
16. AUDITORÍA
==================================================

Pantalla exclusiva para ADMINISTRADOR.

Tabla con:

- Fecha/hora
- Usuario
- Rol
- Acción
- Módulo
- Entidad
- ID entidad
- Detalle

Agregar filtros visuales por:

Usuario
Módulo
Entidad

API:

GET /auditorias
GET /auditorias/usuario/{usuarioId}
GET /auditorias/entidad/{entidad}/{entidadId}

==================================================
17. COMPONENTES REUTILIZABLES
==================================================

Crear Design System reutilizable.

Componentes:

- Sidebar
- Topbar
- Breadcrumb
- Button
- Input
- Select
- Textarea
- DatePicker
- Modal
- Drawer
- Card
- MetricCard
- Table
- Pagination
- Tabs
- Badge
- StatusBadge
- Alert
- Toast
- ConfirmationDialog
- EmptyState
- LoadingState
- ErrorState

Crear variantes coherentes.

==================================================
18. ESTADOS
==================================================

Todas las pantallas importantes deben contemplar visualmente:

Loading
Empty
Error
Success
Disabled

No diseñar solamente el estado ideal.

==================================================
19. TABLAS
==================================================

Las tablas deben ser limpias y profesionales.

Incluir cuando corresponda:

- búsqueda;
- filtros;
- encabezados claros;
- acciones;
- estados mediante badges;
- paginación visual preparada.

No inventar endpoints de paginación si el backend todavía no los posee.

==================================================
20. FORMULARIOS
==================================================

Diseñar formularios pensando en integración real con API.

Cada input debe corresponder a información realmente utilizada por SOFRAM.

Mostrar:

- campos obligatorios;
- mensajes de validación;
- errores;
- botones Guardar / Cancelar;
- confirmación para operaciones sensibles.

Evitar campos inventados.

==================================================
21. UX PARA ADULTOS MAYORES
==================================================

IMPORTANTE:

Los adultos mayores son los residentes registrados, pero los usuarios
principales del sistema son trabajadores de la institución.

Por lo tanto, NO diseñar la interfaz como una aplicación destinada al
adulto mayor.

Debe ser una herramienta profesional para personal administrativo y
sanitario.

Priorizar:

- legibilidad;
- contraste;
- navegación clara;
- tipografía suficientemente grande;
- formularios simples;
- acciones claramente identificables.

==================================================
22. CONSISTENCIA CON BACKEND
==================================================

La interfaz debe estar pensada para conectarse posteriormente con una
REST API real.

NO crear funcionalidades backend inexistentes.

NO inventar:

- facturación;
- pagos;
- obras sociales como módulo independiente;
- chat;
- notificaciones en tiempo real;
- aplicación familiar;
- inventario;
- farmacia;
- telemedicina;
- IA clínica.

==================================================
23. ENTREGA DE FIGMA
==================================================

Generar:

1. Design System
2. Login
3. Dashboard
4. Residentes
5. Perfil de residente
6. Habitaciones
7. Historia Clínica
8. Gestión Médica
9. Personal
10. Calendario
11. Actividades
12. Reportes
13. Auditoría

Crear variantes de formularios, modales y estados necesarios.

Utilizar Auto Layout.

Usar componentes reutilizables.

Mantener nomenclatura clara de frames y componentes.

El resultado debe parecer un sistema administrativo sanitario real,
moderno y listo para convertirse posteriormente en frontend funcional.

La prioridad es:

CLARIDAD > USABILIDAD > CONSISTENCIA > DECORACIÓN.