'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import '../site.css';

/** Wrapper for every marketing page: scoped tokens, nav, footer and the scroll-reveal observer. */
export default function SiteShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();

  // Reveal [data-reveal] elements as they enter the viewport. Re-runs per route: the layout persists.
  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.classList.add('js'); // React never rewrites className here: it's a constant
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    ref.current?.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);

  return (
    <div ref={ref} className="ecm-site" lang="en">
      <Nav />
      <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>{children}</main>
      <Footer />
    </div>
  );
}
