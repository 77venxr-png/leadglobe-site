import Link from 'next/link';
import { hero, mailHref, nav, services, site } from '@/data/site';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <Link className="footer__logo" href="/" aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/leadglobe-orbit-lower-horizontal-white.svg" alt="" width={220} height={59} loading="lazy" />
        </Link>
        <p className="footer__line">{hero.eyebrow}.</p>
      </div>
      <div className="footer__cols">
        <div>
          <p className="footer__h">services</p>
          <ul>
            {services.map((s) => (
              <li key={s.slug}><Link className="u-link" href={`/services/${s.slug}/`}>{s.tab}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="footer__h">company</p>
          <ul>
            {nav.map((n) => (
              <li key={n.href}><a className="u-link" href={n.href}>{n.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="footer__h">contact</p>
          <ul>
            <li><a className="u-link" href={mailHref}>{site.email}</a></li>
            {site.socials.map((s) => (
              <li key={s.href}><a className="u-link" href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer__base">
        <p>© {new Date().getFullYear()} {site.name}</p>
        {site.legal.length > 0 && (
          <ul className="footer__legal">
            {site.legal.map((l) => <li key={l.href}><a className="u-link" href={l.href}>{l.label}</a></li>)}
          </ul>
        )}
      </div>
    </footer>
  );
}
