'use client';

import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import { services } from '../../content/services';
import { engagements, agencyTerms } from '../../content/nearshore';
import { site } from '../../config/site';
import Button from '../Button';
import s from './Pricing.module.css';

const tabs = [
  { id: 'fixed', label: 'Fixed scope' },
  { id: 'capacity', label: 'Nearshore capacity' },
  { id: 'agencies', label: 'Agencies' },
];

export default function Pricing() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ARIA tabs keyboard pattern: arrows, Home, End.
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (n === undefined) return;
    e.preventDefault();
    setActive(n);
    tabRefs.current[n]?.focus();
  };
  const panel = (i: number) => ({
    id: `panel-${tabs[i].id}`,
    role: 'tabpanel',
    'aria-labelledby': `tab-${tabs[i].id}`,
    hidden: active !== i,
    tabIndex: active === i ? 0 : -1,
    className: s.panel,
  });

  return (
    <section id="pricing" className="section on-white" aria-labelledby="pricing-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 id="pricing-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Published pricing. Fixed before we start.</h2>
          </div>
          <p className="lead">Prices in USD. Specialist services have published prices. Websites and stores get a fixed quote after the free diagnosis, never an open-ended hourly bill.</p>
        </header>

        <div>
          <div className={s.tabs__list} role="tablist" aria-label="Pricing type">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[i] = el; }}
                role="tab"
                type="button"
                id={`tab-${t.id}`}
                aria-controls={`panel-${t.id}`}
                aria-selected={active === i}
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div {...panel(0)}>
            <h3 className="visually-hidden">Fixed scope, fixed price</h3>
            <ul role="list" className={s['price-cols']}>
              {services.map((sv) => (
                <li key={sv.slug} className={`${s.pcol} ${sv.lead ? s['pcol--lead'] : ''}`}>
                  {sv.lead && <span className={`${s.pcol__badge} mono`}>Core practice</span>}
                  <h4 className={s.pcol__name}><Link href={`/services/${sv.slug}`}>{sv.name}</Link></h4>
                  <p className={`${s.pcol__tags} muted`}>{sv.tags}</p>
                  <dl>
                    {sv.items.map((it) => <div key={it.label}><dt>{it.label}</dt><dd>{it.price}</dd></div>)}
                  </dl>
                </li>
              ))}
            </ul>
          </div>

          <div {...panel(1)}>
            <h3 className="visually-hidden">Nearshore capacity, Tijuana on Pacific time</h3>
            <ul role="list" className={s.eng}>
              {engagements.map((e) => (
                <li key={e.id} className={s.eng__card}>
                  {e.badge && <span className={`${s.pcol__badge} mono`}>{e.badge}</span>}
                  <h4 className={s.eng__name}>{e.name}</h4>
                  <p className={`muted ${s.eng__meta}`}>{e.meta}</p>
                  <p className={s.eng__price}><span className="muted">{e.priceLabel}</span><strong>{e.price}<small>{e.per}</small></strong></p>
                  <p>{e.text}</p>
                  <p className={`mono muted ${s.eng__wl}`}>{e.whiteLabel}</p>
                </li>
              ))}
            </ul>
            <p className={s.panel__more}><Link href="/nearshore">Compare the cost with a US agency or an in-house hire →</Link></p>
          </div>

          <div {...panel(2)}>
            <h3 className="visually-hidden">Agency / white-label</h3>
            <div className={s.agency}>
              <p className={s.agency__text}>We build under your brand. Unbranded deliverables, NDA standard, and your client never sees our name. Compliance work is the most commonly subcontracted line.</p>
              <dl className={s.agency__terms}>
                {agencyTerms.map((t) => <div key={t.label}><dt>{t.label}</dt><dd>{t.value}</dd></div>)}
              </dl>
              <Button href="/agencies" variant="secondary">The white-label program</Button>
            </div>
          </div>
        </div>

        <div className={s.pricing__cta}>
          <p>Not sure what you need? The diagnosis is free and takes 20 minutes.</p>
          <Button href={site.bookingHref}>{site.bookingLabel}</Button>
        </div>
      </div>
    </section>
  );
}
