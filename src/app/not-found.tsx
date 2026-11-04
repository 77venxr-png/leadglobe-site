import type { Metadata } from 'next';
import Link from 'next/link';
import { services } from '@/data/site';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

// The orbit with nothing at its centre: the route exists, the destination does not.
export default function NotFound() {
  return (
    <section className="nf" aria-labelledby="nf-title">
      <svg className="nf__orbit" viewBox="0 0 600 360" aria-hidden="true">
        <ellipse cx="300" cy="180" rx="262" ry="112" transform="rotate(-30 300 180)" />
        <circle className="nf__empty" cx="300" cy="180" r="70" />
        <rect className="nf__port" x="296" y="176" width="8" height="8" />
      </svg>
      <p className="label">404 / no route</p>
      <h1 id="nf-title" className="nf__title">this page isn&rsquo;t connected to anything.</h1>
      <p className="nf__copy">The link may be old, or the address mistyped. These routes are live:</p>
      <ul className="nf__links">
        <li><Link className="i-link" href="/">home</Link></li>
        {services.map((s) => (
          <li key={s.slug}><Link className="i-link" href={`/services/${s.slug}/`}>{s.tab}</Link></li>
        ))}
      </ul>
    </section>
  );
}
