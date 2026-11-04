// Primary and secondary buttons. The fill floods in from the side the pointer enters
// (src/motion/setup.ts); touch and keyboard get the same fill on press and focus.
import type { ReactNode } from 'react';

export function Button({ href, children, variant = 'ink', arrow = false }: {
  href: string;
  children: ReactNode;
  variant?: 'ink' | 'line' | 'pink';
  arrow?: boolean;
}) {
  return (
    <a className={`btn btn--${variant}`} href={href} data-fill>
      <span className="btn__fill" aria-hidden="true" />
      <span className="btn__label">{children}</span>
      {arrow && <span className="btn__arrow" aria-hidden="true">→</span>}
    </a>
  );
}
