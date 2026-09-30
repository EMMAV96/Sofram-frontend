interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export function SoframLogo({ size = 48, showText = true, textColor = '#1B4332' }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Gold outer ring */}
        <circle cx="60" cy="60" r="58" stroke="#C9A84C" strokeWidth="4" fill="white"/>
        {/* Green hands (left) */}
        <path d="M18 82 C14 72 16 60 24 56 C28 54 32 56 34 60 L36 68 C40 64 46 62 52 64 L52 88 C44 90 34 90 26 86 Z" fill="#2D6A4F"/>
        {/* Green hands (right) */}
        <path d="M102 82 C106 72 104 60 96 56 C92 54 88 56 86 60 L84 68 C80 64 74 62 68 64 L68 88 C76 90 86 90 94 86 Z" fill="#2D6A4F"/>
        {/* House silhouette */}
        <path d="M60 22 L82 42 L82 72 L38 72 L38 42 Z" fill="#1B4332"/>
        <rect x="53" y="55" width="14" height="17" fill="#84A98C"/>
        <rect x="41" y="46" width="10" height="10" fill="#84A98C"/>
        <rect x="69" y="46" width="10" height="10" fill="#84A98C"/>
        {/* Chimney */}
        <rect x="70" y="30" width="6" height="14" fill="#1B4332"/>
        {/* People heads */}
        <circle cx="51" cy="50" r="7" fill="#C9A84C" opacity="0.9"/>
        <circle cx="69" cy="50" r="7" fill="#C9A84C" opacity="0.75"/>
        {/* Glasses on left person */}
        <rect x="46" y="49" width="4" height="3" rx="1" fill="#1B4332" opacity="0.5"/>
        <rect x="51" y="49" width="4" height="3" rx="1" fill="#1B4332" opacity="0.5"/>
      </svg>
      {showText && (
        <div>
          <div style={{ color: textColor, fontFamily: 'Lora, serif', fontWeight: 700, fontSize: size * 0.42, lineHeight: 1, letterSpacing: '0.05em' }}>SOFRAM</div>
          <div style={{ color: '#C9A84C', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: size * 0.19, lineHeight: 1.2, letterSpacing: '0.06em', marginTop: 2 }}>
            SISTEMA DE RESIDENCIA<br/>DE ADULTOS MAYORES
          </div>
        </div>
      )}
    </div>
  );
}

export function SoframIcon({ size = 40 }: { size?: number }) {
  return <SoframLogo size={size} showText={false} />;
}
