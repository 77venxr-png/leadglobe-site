// Interface parts for the workflow illustrations: small source chips, white record cards with
// field rows, status badges, and the dark result card. Server-safe (no hooks).
import type { ReactNode } from 'react';

/** A source input: small pill with a square marker, a label and one line of detail. */
export function Chip({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="chip">
      <span className="chip__mark" aria-hidden="true" />
      <span className="chip__label">{label}</span>
      <span className="chip__detail">{detail}</span>
    </div>
  );
}

/** A white interface card with a mono header and optional badge. */
export function Card({ label, badge, title, sub, children, dark = false }: {
  label: string;
  badge?: ReactNode;
  title?: string;
  sub?: string;
  children?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`card${dark ? ' card--dark' : ''}`}>
      <div className="card__head">
        <span className="card__label">{label}</span>
        {badge}
      </div>
      {title && <p className="card__title">{title}</p>}
      {sub && <p className="card__sub">{sub}</p>}
      {children}
    </div>
  );
}

/** Key / value row inside a card. */
export function Row({ k, v, tone }: { k: string; v: ReactNode; tone?: 'ok' | 'pink' }) {
  return (
    <div className="row">
      <span className="row__k">{k}</span>
      <span className={`row__v${tone ? ` row__v--${tone}` : ''}`}>{v}</span>
    </div>
  );
}

/** Static badge. */
export function Badge({ children, tone = 'line' }: { children: ReactNode; tone?: 'line' | 'pink' | 'ink' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

/** Status that settles when the signal reaches its node: `pending` while running, `done` after.
 *  Without motion (reduced motion, no JS) only the final state shows. */
export function Status({ pending, done }: { pending: string; done: string }) {
  return (
    <span className="status">
      {/* Both labels share one grid cell, so the badge keeps the width of the longer one. */}
      <span className="status__text">
        <span className="status__pending">{pending}</span>
        <span className="status__done">{done}</span>
      </span>
    </span>
  );
}

/** Initials avatar for sample people. */
export function Avatar({ initials }: { initials: string }) {
  return <span className="avatar" aria-hidden="true">{initials}</span>;
}

/** Small check mark. */
export function Check() {
  return (
    <svg className="check" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
