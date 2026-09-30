interface LogoProps { size?: number; showText?: boolean; textColor?: string }
const brandingAssets = import.meta.glob('/src/assets/branding/sofram-logo.png', { eager: true, query: '?url', import: 'default' });
const logoUrl = brandingAssets['/src/assets/branding/sofram-logo.png'] as string | undefined;
export function SoframLogo({ size = 64, showText = true, textColor = 'var(--primary)' }: LogoProps) {
  return <div className="brand-lockup">
    {logoUrl && <img src={logoUrl} alt="Logo oficial de SOFRAM" width={size} height={size} className="object-contain shrink-0" />}
    {showText && <div><div style={{ color: textColor, fontFamily: 'Lora, serif', fontWeight: 700, fontSize: 25, letterSpacing: '.05em' }}>SOFRAM</div>
      <p className="brand-subtitle">Residencia de Adultos Mayores</p></div>}
  </div>;
}
export function SoframIcon({ size = 40 }: { size?: number }) { return <SoframLogo size={size} showText={false} />; }
