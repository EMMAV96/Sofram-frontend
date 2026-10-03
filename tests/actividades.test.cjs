const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function load(file, imports, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, ...globals });
  return exports;
}

test('PUT, DELETE and activity PDF use the agreed endpoints and unchanged payload', async () => {
  const calls = [];
  const client = { apiRequest: async (...args) => { calls.push(args); }, apiRequestBlob: async (...args) => { calls.push(args); } };
  const api = load('src/api/actividadesApi.ts', { './apiClient': client });
  const reports = load('src/api/reportesApi.ts', { './apiClient': client });
  const request = { nombre: 'Memoria', taller: 'Cognitivo', empleadoId: 2, detalleCalendarioId: 1, tipo: 'COGNITIVA', duracion: 60, cupoMaximo: 12, estado: 'ACTIVA' };
  await api.actualizarActividad(10, request);
  assert.equal(calls[0][0], '/actividades/10');
  assert.equal(calls[0][1].method, 'PUT');
  assert.equal(calls[0][1].body, request);
  assert.equal(await api.eliminarActividad(10), undefined);
  assert.equal(calls[1][0], '/actividades/10');
  assert.equal(calls[1][1].method, 'DELETE');
  assert.equal(calls[1][1].body, undefined);
  const signal = new AbortController().signal;
  await reports.descargarReporteActividad(10, signal);
  assert.equal(calls[2][0], '/reportes/actividades/10/pdf');
  assert.equal(calls[2][1].signal, signal);
});

test('activity reports are restricted to administrator and therapist; existing reports retain their roles', () => {
  const p = load('src/auth/reportesPermissions.ts', {});
  for (const role of ['ADMINISTRADOR', 'TERAPISTA_OCUPACIONAL']) assert.equal(p.canViewReporteActividad(role), true);
  for (const role of ['ADMINISTRATIVO', 'MEDICO', 'PSICOLOGO', 'LIC_ENFERMERIA', 'ENFERMERO', undefined]) assert.equal(p.canViewReporteActividad(role), false);
  assert.equal(p.canViewReportes('TERAPISTA_OCUPACIONAL'), true);
  assert.equal(p.canViewReporteClinico('TERAPISTA_OCUPACIONAL'), false);
  assert.equal(p.canViewReporteOcupacion('TERAPISTA_OCUPACIONAL'), false);
  assert.equal(p.canViewReporteClinico('MEDICO'), true);
  assert.equal(p.canViewReporteOcupacion('ADMINISTRATIVO'), true);
});

// Exercise the form submit handler without a browser or a live backend.
// Native input editing and visual layout still need browser verification.
function formHarness({ actividad, reject = false, role = 'TERAPISTA_OCUPACIONAL' } = {}) {
  const slots = [], effects = [], calls = [];
  let cursor = 0;
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value; }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect(fn) { effects.push(fn); },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const submit = async (method, id, body) => { calls.push({ method, id, body }); if (reject) throw new Error('El cupo no puede ser menor a los participantes existentes.'); return { ...body, id: id ?? 10 }; };
  const component = load('src/components/actividades/ActividadModal.tsx', {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '../../api/actividadesApi': { crearActividad: body => submit('POST', undefined, body), actualizarActividad: (id, body) => submit('PUT', id, body) },
    '../../api/calendariosApi': { listarCalendarios() {}, listarDetalles() {}, obtenerDetalle() {} },
    '../../api/personalApi': { listarEmpleados() {} },
    '../../auth/AuthContext': { useAuth: () => ({ user: { rol: role, empleadoId: 2 } }) },
    '../../auth/actividadesPermissions': { canCreateActividad: r => ['ADMINISTRADOR', 'TERAPISTA_OCUPACIONAL'].includes(r) },
    '../residentes/ResidenteModal': { ResidenteModal: 'modal' },
    '../residentes/shared': {
      ErrorNotice: 'error', errorMessage: e => e.message, fieldErrors: () => ({}), formatFecha: f => f,
      useApiResource: (_loader, key) => ({ loading: false, error: '', data: key.startsWith('editar-franja') ? { calendarioId: 1 } : key.startsWith('franjas') ? [{ id: 1, calendarioId: 1 }] : [] }),
    },
  }, { FormData: class { constructor(data) { this.data = data; } get(key) { return this.data[key]; } } }).ActividadModal;
  let saved;
  const props = { actividad, onClose() {}, onSaved: value => { saved = value; } };
  function render() { cursor = 0; effects.length = 0; return component(props); }
  function nodes(node) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)]; }
  render(); effects.forEach(fn => fn());
  if (!actividad) { const calendar = nodes(render()).find(n => n.props?.id === 'actividad-calendario'); calendar.props.onChange({ target: { value: '1' } }); }
  return { render, nodes, calls, get saved() { return saved; } };
}

const activity = { id: 10, empleadoId: 7, detalleCalendarioId: 1, taller: 'Taller de memoria', nombre: 'Orientación', descripcion: 'Sesión', tipo: 'COGNITIVA', duracion: 60, cupoMaximo: 12, estado: 'ACTIVA' };
const values = { ...activity, duracion: '60', cupoMaximo: '12', detalleCalendarioId: '1' };

test('editing preloads fields and PUT preserves the existing responsible employee for therapist', async () => {
  const h = formHarness({ actividad: activity });
  const nodes = h.nodes(h.render());
  assert.equal(nodes.find(n => n.props?.id === 'actividad-nombre').props.defaultValue, activity.nombre);
  assert.equal(nodes.find(n => n.props?.id === 'actividad-taller').props.defaultValue, activity.taller);
  assert.equal(nodes.find(n => n.props?.id === 'actividad-detalle').props.defaultValue, '1');
  for (const name of ['nombre', 'taller']) {
    const input = nodes.find(n => n.props?.id === `actividad-${name}`);
    assert.equal(input.props.readOnly, undefined);
    assert.equal(input.props.disabled, undefined);
    assert.equal(input.props.value, undefined);
  }
  await nodes.find(n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: values });
  assert.equal(h.calls[0].method, 'PUT');
  assert.equal(h.calls[0].id, 10);
  assert.equal(h.calls[0].body.empleadoId, 7);
  assert.equal(h.saved.nombre, activity.nombre);
  assert.equal('participaciones' in h.calls[0].body, false);
});

test('creation uses session responsible and sends null for an empty workshop', async () => {
  const h = formHarness();
  await h.nodes(h.render()).find(n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { ...values, taller: '' } });
  assert.equal(h.calls[0].method, 'POST');
  assert.equal(h.calls[0].body.empleadoId, 2);
  assert.equal(h.calls[0].body.taller, null);
});

test('backend capacity rejection is displayed and form unlocks without a success callback', async () => {
  const h = formHarness({ actividad: activity, reject: true });
  await h.nodes(h.render()).find(n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: values });
  const nodes = h.nodes(h.render());
  assert.equal(h.saved, undefined);
  assert.match(nodes.find(n => n.type === 'error').props.message, /participantes existentes/);
  assert.equal(nodes.find(n => n.type === 'fieldset').props.disabled, false);
});
