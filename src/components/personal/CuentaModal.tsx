import { useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/apiClient';
import * as api from '../../api/usuariosApi';
import type { EmpleadoResponse } from '../../api/personalApi';
import { useAuth } from '../../auth/AuthContext';
import { canAccessPersonal } from '../../auth/personalPermissions';
import { ResidenteModal } from '../residentes/ResidenteModal';
import { ErrorNotice, inputStyle, primaryStyle, useApiResource } from '../residentes/shared';

function accountError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      if (/empleado/i.test(error.message)) return 'Este empleado ya tiene una cuenta de acceso.';
      if (/username|usuario|user.?name/i.test(error.message)) return 'El nombre de usuario ya está en uso.';
      return 'El usuario o el empleado ya tienen una cuenta asociada. Actualice el listado y revise los datos.';
    }
    if (error.status === 403) return 'Acceso no autorizado para administrar cuentas.';
    if (error.status === 401) return 'La sesión ha expirado.';
    if (error.status === 400 || error.status === 422) return 'Revise los datos ingresados. No cumplen las condiciones del servidor.';
  }
  return 'No fue posible guardar la cuenta. Intente nuevamente.';
}

type Props = { empleado: EmpleadoResponse; cuenta?: api.UsuarioResponse; onClose: () => void; onSaved: (message: string) => void };
export function CuentaModal(props: Props) {
  const [passwordMode, setPasswordMode] = useState(false);
  const { user } = useAuth();
  if (!canAccessPersonal(user?.rol)) return null;
  return passwordMode && props.cuenta
    ? <PasswordModal cuenta={props.cuenta} onClose={() => setPasswordMode(false)} onSaved={props.onSaved} />
    : <CuentaForm {...props} onPassword={() => setPasswordMode(true)} />;
}

function CuentaForm({ empleado, cuenta, onClose, onSaved, onPassword }: Props & { onPassword: () => void }) {
  const { user } = useAuth();
  const allowed = canAccessPersonal(user?.rol);
  const roles = useApiResource(api.listarRoles, 'roles-cuenta', allowed);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [selectedRole, setSelectedRole] = useState(cuenta?.rol ?? '');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || pending.current || roles.loading || roles.error) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const username = String(values.get('username') ?? '').trim();
    const rol = String(values.get('rol') ?? '');
    const password = String(values.get('password') ?? '');
    if (!username || !roles.data?.some(r => r.nombre === rol) || (!cuenta && !password)) { setError('Complete usuario, rol y contraseña inicial cuando corresponda.'); return; }
    pending.current = true; setBusy(true); setError('');
    try {
      if (cuenta) await api.actualizarUsuario(cuenta.id, { username, rol });
      else await api.crearUsuario({ empleadoId: empleado.id, username, password, rol });
      form.reset(); onSaved(cuenta ? 'Cuenta actualizada correctamente.' : 'Cuenta creada correctamente.');
    } catch (cause) { setError(accountError(cause)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <ResidenteModal title={cuenta ? 'Administrar cuenta' : 'Crear cuenta de acceso'} compact busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg bg-muted p-3"><p className="font-semibold">{empleado.nombre} {empleado.apellido}</p><p className="text-xs">Cargo laboral: {empleado.cargoNombre}</p></div>
      {error && <ErrorNotice message={error} />}
      {roles.error && <ErrorNotice message="No se pudieron cargar los roles." retry={roles.reload} />}
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm">Usuario<input name="username" required defaultValue={cuenta?.username ?? ''} autoComplete="off" className="mt-1 w-full rounded-lg px-3 py-2" style={inputStyle} /></label>
        {!cuenta && <label className="block text-sm">Contraseña inicial<div className="flex gap-2 mt-1"><input name="password" required type={show ? 'text' : 'password'} autoComplete="new-password" className="min-w-0 flex-1 rounded-lg px-3 py-2" style={inputStyle} /><button type="button" aria-pressed={show} onClick={() => setShow(!show)} className="text-xs">{show ? 'Ocultar' : 'Mostrar'}</button></div></label>}
        <label className="block text-sm">Rol del sistema<select name="rol" required value={selectedRole} onChange={event => setSelectedRole(event.target.value)} disabled={roles.loading || !!roles.error} className="mt-1 w-full rounded-lg px-3 py-2" style={inputStyle}>
          <option value="">{roles.loading ? 'Cargando roles…' : 'Seleccione un rol'}</option>
          {roles.data?.map(r => <option key={r.id} value={r.nombre}>{r.nombre}{r.descripcion ? ` — ${r.descripcion}` : ''}</option>)}
        </select></label>
        {cuenta && <p className="text-sm">Estado: <strong>{cuenta.activo ? 'Activa' : 'Inactiva'}</strong></p>}
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="px-3 py-2 rounded-lg" style={inputStyle}>Cancelar</button><button disabled={busy || roles.loading || !!roles.error || !roles.data?.length} className="px-3 py-2 rounded-lg disabled:opacity-50" style={primaryStyle}>{busy ? 'Guardando…' : cuenta ? 'Guardar cambios' : 'Crear cuenta'}</button></div>
      {cuenta && <section className="border-t border-border pt-4"><h3 className="text-sm mb-2">Seguridad</h3><button type="button" disabled={busy} onClick={onPassword} className="text-sm underline text-primary">Restablecer contraseña</button></section>}
    </form>
  </ResidenteModal>;
}

function PasswordModal({ cuenta, onClose, onSaved }: { cuenta: api.UsuarioResponse; onClose: () => void; onSaved: (message: string) => void }) {
  const { user } = useAuth();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAccessPersonal(user?.rol) || pending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get('password') ?? '');
    if (!password || password !== data.get('confirmation')) { setError('Las contraseñas deben coincidir.'); return; }
    pending.current = true; setBusy(true); setError('');
    try { await api.cambiarPassword(cuenta.id, { password }); form.reset(); onSaved('Contraseña actualizada correctamente.'); }
    catch (cause) { setError(accountError(cause)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <ResidenteModal title="Restablecer contraseña" compact busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm">Usuario: {cuenta.username}</p>
      {error && <ErrorNotice message={error} />}
      <fieldset disabled={busy} className="space-y-3">
        <label className="block text-sm">Nueva contraseña<input name="password" type="password" autoComplete="new-password" required className="mt-1 w-full rounded-lg px-3 py-2" style={inputStyle} /></label>
        <label className="block text-sm">Confirmar contraseña<input name="confirmation" type="password" autoComplete="new-password" required className="mt-1 w-full rounded-lg px-3 py-2" style={inputStyle} /></label>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="px-3 py-2 rounded-lg" style={inputStyle}>Cancelar</button><button disabled={busy} className="px-3 py-2 rounded-lg" style={primaryStyle}>{busy ? 'Guardando…' : 'Actualizar contraseña'}</button></div>
    </form>
  </ResidenteModal>;
}
