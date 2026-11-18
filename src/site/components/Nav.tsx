'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { site } from '../config/site';
import { services } from '../content/services';
import Logo from './Logo';
import Button from './Button';
import Icon from './Icon';
import s from './Nav.module.css';

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dock, setDock] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Open sheet: lock scroll, make the rest of the page inert, move focus into the sheet.
  useEffect(() => {
    const outside = [document.getElementById('main-content'), document.querySelector('.ecm-site footer'), dockRef.current].filter(Boolean) as HTMLElement[];
    document.body.style.overflow = open ? 'hidden' : '';
    outside.forEach((el) => (el.inert = open));
    if (open) sheetRef.current?.querySelector('a')?.focus();
    return () => {
      document.body.style.overflow = '';
      outside.forEach((el) => (el.inert = false));
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen((was) => {
          if (was) toggleRef.current?.focus();
          return false;
        });
      }
    };
    const mq = matchMedia('(min-width: 60rem)');
    const onMq = (m: MediaQueryListEvent) => m.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, []);

  // Scrolled state + mobile booking dock (hidden near the final CTA / footer, and on /book).
  useEffect(() => {
    const seen = new Set<Element>();
    const onBook = path.startsWith('/book');
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setDock(!onBook && y > window.innerHeight * 0.9 && seen.size === 0);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      update();
    });
    document.querySelectorAll('.ecm-site [data-final-cta], .ecm-site footer').forEach((el) => io.observe(el));
    addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      io.disconnect();
      removeEventListener('scroll', update);
    };
  }, [path]);

  const navCls = [s.nav, scrolled && s['is-scrolled'], open && s['is-open']].filter(Boolean).join(' ');

  return (
    <>
      <header className={navCls} data-tone="dark">
        <div className={`container ${s.nav__inner}`}>
          <Link className={s.nav__brand} href="/" aria-label="E-commetrics, home">
            <Logo />
          </Link>

          <nav className={s.nav__links} aria-label="Primary">
            <ul role="list">
              {site.nav.map((l) => (
                <li key={l.href}><Link href={l.href} aria-current={path === l.href ? 'page' : undefined}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div className={s.nav__cta}>
            <Link className={s.nav__dash} href="/login">Dashboard</Link>
            <Button href={site.bookingHref} size="md" className="nav__book">{site.bookingLabel}</Button>
            <button ref={toggleRef} className={s.nav__toggle} type="button" aria-expanded={open} aria-controls="nav-sheet" onClick={() => setOpen(!open)}>
              <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
              <Icon name={open ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>

        <div className={`${s.sheet} on-dark`} id="nav-sheet" ref={sheetRef} hidden={!open} onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
          <div className={`container ${s.sheet__inner}`}>
            <nav aria-label="Mobile">
              <ul role="list" className={s.sheet__primary}>
                {site.nav.map((l, i) => (
                  <li key={l.href} style={{ '--i': i } as CSSProperties}><Link href={l.href}>{l.label}</Link></li>
                ))}
              </ul>
              <p className={`eyebrow ${s.sheet__label}`}>Services</p>
              <ul role="list" className={s.sheet__services}>
                {services.map((sv) => (
                  <li key={sv.slug}><Link href={`/services/${sv.slug}`}>{sv.name}</Link></li>
                ))}
                <li><Link href="/agencies">Agency / white-label</Link></li>
              </ul>
            </nav>
            <div className={s.sheet__foot}>
              <Button href={site.bookingHref} size="lg">{site.bookingLabel}</Button>
              <a className="mono" href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </div>
        </div>
      </header>

      <div className={`${s.dock} ${dock ? s['is-visible'] : ''}`} ref={dockRef}>
        <Button href={site.bookingHref} size="lg" tabIndex={dock ? 0 : -1} aria-hidden={!dock}>{site.bookingLabel}</Button>
      </div>
    </>
  );
}
