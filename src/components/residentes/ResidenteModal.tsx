import { useEffect, useRef, type ReactNode } from 'react';
import { cardStyle } from './shared';

export function ResidenteModal({ title, busy, onClose, children, compact = false }: { title: string; busy: boolean; onClose: () => void; children: ReactNode; compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="residente-modal-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl p-6 shadow-2xl backdrop:bg-black/40" style={{ ...cardStyle, maxWidth: compact ? '30rem' : undefined, maxHeight: '90vh', overflowY: 'auto', color: 'var(--foreground)' }}>
    <div className="flex items-center justify-between mb-5">
      <h2 id="residente-modal-title" style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{title}</h2>
      <button type="button" disabled={busy} onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-full hover:bg-gray-100 disabled:opacity-50">✕</button>
    </div>
    {children}
  </dialog>;
}
