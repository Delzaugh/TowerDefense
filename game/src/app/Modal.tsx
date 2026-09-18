import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [open]);
  return <dialog ref={ref} className="wave-dialog" aria-labelledby="wave-dialog-title" onCancel={onClose} onClose={onClose}>
    <div className="dialog-heading"><h2 id="wave-dialog-title">Wave queue settings</h2><button autoFocus onClick={onClose} aria-label="Close wave queue">Done / close</button></div>
    {children}
  </dialog>;
}
