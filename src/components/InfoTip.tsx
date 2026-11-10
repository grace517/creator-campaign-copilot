import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const EDGE = 16;
const MAX_WIDTH = 380;

/**
 * An "i" button that shows a short explanation. It's open while hovered, while focused, or once clicked or
 * tapped (phones have no hover), until Escape, a click elsewhere, or a second click. The text stays in the DOM,
 * linked with aria-describedby, so screen readers hear it with the button.
 *
 * The tip is fixed-positioned under the button and kept 16px inside the screen. Fixed, so it can never widen the
 * page (on a phone, a wider page would widen the viewport and throw the measurement off).
 */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const open = hover || focus || pinned;
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = root.current!.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const width = Math.min(MAX_WIDTH, vw - EDGE * 2);
      const preferred = btn.left + btn.width / 2 - width * 0.3;
      setPos({ left: Math.max(EDGE, Math.min(preferred, vw - EDGE - width)), top: btn.bottom + 8, width });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setPinned(false);
      setHover(false);
      setFocus(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && close();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <span className="infotip" ref={root} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        className="infotip__btn"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onClick={() => {
          // A second click closes it, even though the button still has focus and the pointer is over it.
          if (open && pinned) {
            setPinned(false);
            setFocus(false);
            setHover(false);
          } else setPinned(true);
        }}
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className={`infotip__body${open && pos ? ' is-open' : ''}`}
        style={pos ? { left: pos.left, top: pos.top, width: pos.width } : undefined}
      >
        {children}
      </span>
    </span>
  );
}
