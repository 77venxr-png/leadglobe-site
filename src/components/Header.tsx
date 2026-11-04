'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { contactHref, nav, site } from '@/data/site';
import { startScroll, stopScroll } from '@/engine';
import { Button } from './Button';

export function Header() {
  const pathname = usePathname();
  // The menu belongs to the route it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(open) : v;
    setOpenOn(next ? pathname : null);
  };
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);

  // Menu: lock scroll, focus the first link, trap Tab, Escape closes and restores focus.
  useEffect(() => {
    if (!open) return;
    stopScroll();
    document.documentElement.classList.add('menu-open');
    const links = () => [...(menu.current?.querySelectorAll<HTMLElement>('a, button') || [])];
    links()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenOn(null); toggle.current?.focus(); return; }
      if (e.key !== 'Tab') return;
      const all = [toggle.current!, ...links()];
      const i = all.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? all.length - 1 : i - 1) : (i === all.length - 1 ? 0 : i + 1);
      e.preventDefault();
      all[next].focus();
    };
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('menu-open');
      startScroll();
    };
  }, [open]);

  const current = (href: string) => (href === '/#services' && pathname.startsWith('/services') ? 'page' : undefined);

  return (
    <header className="header">
      <div className="header__bar">
        <Link className="header__logo" href="/" aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/leadglobe-orbit-lower-horizontal-black.svg" alt="" width={180} height={48} />
        </Link>
        <nav className="header__nav" aria-label="Main">
          <ul>
            {nav.map((n) => (
              <li key={n.href}><a className="draw" href={n.href} aria-current={current(n.href)}>{n.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="header__cta">
          <Button href={contactHref}>{site.cta.primary}</Button>
        </div>
        <button
          ref={toggle}
          className="header__menu-btn"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'close' : 'menu'}
        </button>
      </div>
      <nav id="menu" ref={menu} className="menu" aria-label="Menu" hidden={!open}>
        <ul>
          {nav.map((n) => (
            <li key={n.href}><a href={n.href} onClick={() => setOpen(false)}>{n.label}</a></li>
          ))}
        </ul>
        <Button href={contactHref}>{site.cta.primary}</Button>
      </nav>
    </header>
  );
}
