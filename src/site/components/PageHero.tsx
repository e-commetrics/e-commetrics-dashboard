import Link from 'next/link';
import type { ReactNode } from 'react';
import s from './PageHero.module.css';

export interface Crumb { name: string; path: string }

export default function PageHero({ eyebrow, title, lead, crumbs, children }: { eyebrow?: string; title: string; lead?: string; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <section className={`${s.phero} on-dark`} aria-labelledby="page-title">
      <div className={s.phero__grid} aria-hidden="true" />
      <div className="container">
        {crumbs && (
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <ol role="list">
              {crumbs.map((c, i) => (
                <li key={c.path}>
                  {i < crumbs.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className={`eyebrow ${s.eyebrow}`}>{eyebrow}</p>}
        <h1 id="page-title" className={`h1 ${s.phero__title}`}>{title}</h1>
        {lead && <p className={`lead ${s.phero__lead}`}>{lead}</p>}
        {children && <div className={s.phero__slot}>{children}</div>}
      </div>
    </section>
  );
}
