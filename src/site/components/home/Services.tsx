import Link from 'next/link';
import type { CSSProperties } from 'react';
import { services, fromLabel } from '../../content/services';
import { site } from '../../config/site';
import Icon, { type IconName } from '../Icon';
import Button from '../Button';
import s from './Services.module.css';

const lead = services.find((x) => x.lead)!;
const cells: { href: string; icon: IconName; aud: string; name: string; tags: string; promise: string; price: string }[] = [
  ...services
    .filter((x) => !x.lead)
    .map((x) => ({ href: `/services/${x.slug}`, icon: x.icon, aud: x.audience, name: x.name, tags: x.tags, promise: x.promise, price: fromLabel(x) })),
  {
    href: '/nearshore',
    icon: 'users',
    aud: 'For teams that need more hands',
    name: 'Nearshore Engineers',
    tags: 'Dedicated seat · two-week sprints',
    promise: 'A named senior engineer inside your team, your tools and your hours.',
    price: '$5,200/mo',
  },
];

export default function Services() {
  return (
    <section id="services" className="section on-paper-2" aria-labelledby="services-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="eyebrow">Services</p>
            <h2 id="services-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Fixed scope where scope can be fixed.</h2>
          </div>
          <p className="lead">Capacity where it can’t. Every project is diagnosed, built and owned end to end by a senior engineer, and ships accessible, fast and secure by default.</p>
        </header>

        <article className={`${s.feature} on-indigo`} data-reveal aria-labelledby="svc-lead">
          <div>
            <p className={`${s.feature__badge} mono`}>Core practice</p>
            <h3 id="svc-lead" className={s.feature__title}>
              <Icon name={lead.icon} size={28} />
              {lead.name}
            </h3>
            <p className={`${s.feature__tags} mono`}>{lead.tags}</p>
            <p className={s.feature__aud}>{lead.audience}</p>
            <p className={s.feature__promise}>{lead.promise}</p>
            <p className={`${s.feature__outcome} muted`}>{lead.outcome}</p>
            <div className={s.feature__ctas}>
              <Button href={`/services/${lead.slug}`} variant="light">Explore web development</Button>
              <Button href={site.bookingHref} variant="ghost" icon="arrow-up-right">Start with a free diagnosis</Button>
            </div>
          </div>
          <dl className={s.feature__prices}>
            {lead.items.map((it) => (
              <div key={it.label}><dt>{it.label}</dt><dd>{it.price}</dd></div>
            ))}
          </dl>
        </article>

        <ul className={s.grid} role="list">
          {cells.map((c, i) => (
            <li key={c.href} className={s.cell} data-reveal style={{ '--reveal-i': i % 3 } as CSSProperties}>
              <Link className={s.cell__link} href={c.href}>
                <span className={s.cell__icon}><Icon name={c.icon} size={24} /></span>
                <span className={`${s.cell__aud} mono`}>{c.aud}</span>
                <h3 className={s.cell__title}>{c.name}</h3>
                <span className={s.cell__tags}>{c.tags}</span>
                <p className={s.cell__promise}>{c.promise}</p>
                <span className={s.cell__foot}>
                  <span className={s.cell__price}><strong>{c.price}</strong></span>
                  <span className={s.cell__arrow}><Icon name="arrow-right" size={18} /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
