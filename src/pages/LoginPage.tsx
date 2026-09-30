import institutionalImage from '../imports/ChatGPT_Image_24_feb_2026__10_39_20_a.m.-20260224-133921.png';
import { useState } from 'react';
import { SoframLogo } from '../components/Logo';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { loading: sessionLoading, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (loading || sessionLoading) return;
    if (!usuario || !contrasena) {
      setError('Por favor complete todos los campos.');
      return;
    }
    setLoading(true);
    login({ username: usuario, password: contrasena })
      .then(() => {
        window.location.assign('/dashboard');
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'No fue posible iniciar sesión.');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <section className="hidden lg:flex w-1/2 flex-col justify-center p-8 xl:p-12" style={{ background: 'var(--muted)' }}>
        <img src={institutionalImage} alt="SOFRAM. Sistema de residencia de adultos mayores" className="w-full rounded-2xl shadow-sm" />
        <blockquote className="mt-8 text-2xl xl:text-3xl leading-relaxed text-primary" style={{ fontFamily: 'Lora, serif' }}>Cuidar con profesionalismo,<br />registrar con precisión.</blockquote>
        <p className="mt-4 text-sm text-muted-foreground">Sistema de gestión integral para residencias de adultos mayores.</p>
      </section>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6">
            <SoframLogo size={56} />
          </div>

          <div className="mb-6">
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
              Iniciar sesión
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 15 }}>
              Ingrese sus credenciales para acceder al sistema.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Usuario <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="login-username" type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="Ingrese su usuario"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: '1.5px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--secondary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Contraseña <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password" type={showPass ? 'text' : 'password'}
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-20 rounded-lg text-sm outline-none transition-all"
                  style={{
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--secondary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPass} onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPass ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || sessionLoading}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all mt-2"
              style={{
                background: loading ? 'var(--secondary)' : 'var(--primary)',
                color: 'var(--primary-foreground)',
                letterSpacing: '0.04em',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-5 text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
            Acceso seguro para el equipo de la residencia.
          </p>
        </div>
      </div>
    </div>
  );
}
