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
      {/* Left panel - branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ background: 'var(--primary)' }}
      >
        {/* Subtle botanical overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #84A98C 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #C9A84C 0%, transparent 50%)' }} />

        <div className="relative z-10">
          <SoframLogo size={64} textColor="#F7F5F0" />
        </div>

        <div className="relative z-10">
          <blockquote className="text-xl italic" style={{ color: 'rgba(247,245,240,0.85)', fontFamily: 'Lora, serif', lineHeight: 1.6 }}>
            "Cuidar con profesionalismo,<br />registrar con precisión."
          </blockquote>
          <p className="mt-4 text-sm" style={{ color: 'rgba(247,245,240,0.45)' }}>
            Sistema de gestión integral para residencias de adultos mayores.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-px" style={{ background: 'var(--accent)' }} />
          <p className="text-xs" style={{ color: 'rgba(247,245,240,0.4)', letterSpacing: '0.08em' }}>SOFRAM © 2026</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <SoframLogo size={56} />
          </div>

          <div className="mb-8">
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
              Iniciar sesión
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 15 }}>
              Ingrese sus credenciales para acceder al sistema.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Usuario <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
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
                  type={showPass ? 'text' : 'password'}
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-lg text-sm outline-none transition-all"
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
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPass ? '🙈' : '👁'}
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

          <p className="mt-8 text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
            POST /auth/login · JWT · Spring Boot
          </p>
        </div>
      </div>
    </div>
  );
}
