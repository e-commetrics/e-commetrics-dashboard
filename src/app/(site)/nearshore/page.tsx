import type { CSSProperties } from 'react';
import PageHero from '@/site/components/PageHero';
import Button from '@/site/components/Button';
import CostComparator from '@/site/components/home/CostComparator';
import FinalCta from '@/site/components/FinalCta';
import JsonLd from '@/site/components/JsonLd';
import { engagements, costRows, costSource } from '@/site/content/nearshore';
import { faq } from '@/site/content/faq';
import { site } from '@/site/config/site';
import { breadcrumbJsonLd, faqJsonLd, orgJsonLd } from '@/site/lib/schema';
import { pageMeta } from '@/site/lib/meta';
import s from './page.module.css';

export const metadata = pageMeta({
  title: 'Nearshore Senior Engineers on Pacific Time',
  description: 'A named senior engineer inside your team for $5,200/mo, or two-week sprints at $7,200. Tijuana, 30 minutes from San Diego, full Pacific overlap, USD contracts.',
  path: '/nearshore',
  og: 'nearshore',
});

const crumbs = [{ name: 'Home', path: '/' }, { name: 'Nearshore engineers', path: '/nearshore' }];
const nearFaq = faq.filter((f) => /Mexico|sprint|own/i.test(f.q));
const ramp = [
  { t: 'Week 0', d: 'Scope call, role profile and access list agreed. Contract and invoicing in USD.' },
  { t: 'Week 1', d: 'Your engineer joins your tools: repo, board, chat. Reads the codebase, pairs with your lead.' },
  { t: 'Week 2', d: 'First commit merged. From here: your standups, your sprint cadence, your hours.' },
];

export default function NearshorePage() {
  return (
    <>
      <JsonLd data={[orgJsonLd(), breadcrumbJsonLd(crumbs), faqJsonLd(nearFaq)]} />
      <PageHero
        eyebrow="Nearshore capacity · Tijuana on Pacific time"
        title="A senior engineer on your team. On your clock."
        lead="Not shared studio time and not an overnight queue. A named engineer in your standups, your board and your repo, 30 minutes from San Diego, for less than half the cost of an in-house hire."
        crumbs={crumbs}
      >
        <Button href={site.bookingHref} size="lg">Talk about your team</Button>
        <Button href="#models" variant="secondary" size="lg" icon={null}>See the two models</Button>
      </PageHero>

      <section id="models" className="section" aria-labelledby="models-title">
        <div className="container">
          <header className="section-head section-head--split">
            <div>
              <p className="eyebrow">Two ways to engage</p>
              <h2 id="models-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>By the month, or by the sprint.</h2>
            </div>
            <p className="lead">Scale by adding seats, not by renegotiating scope. Stop after any sprint.</p>
          </header>
          <ul role="list" className={s.models}>
            {engagements.map((e, i) => (
              <li key={e.id} className={`${s.model} ${i === 0 ? s['model--core'] : ''}`} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
                {e.badge && <span className={`${s.model__badge} mono`}>{e.badge}</span>}
                <h3 className={s.model__name}>{e.name}</h3>
                <p className="muted">{e.meta}</p>
                <p className={s.model__price}><span className="muted">{e.priceLabel}</span><strong>{e.price}<small>{e.per}</small></strong></p>
                <p>{e.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CostComparator />

      <section className="section on-white" aria-labelledby="same-title">
        <div className={`container ${s.same}`}>
          <div>
            <p className="eyebrow">San Diego market, 2026</p>
            <h2 id="same-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>What the same engineer costs.</h2>
            <p className="lead" style={{ marginTop: 'var(--s-5)' }}>2.3× below an in-house hire. 4.6× below a US agency. And unlike a hire: no recruiting cycle, no severance risk, no ramp on your payroll.</p>
          </div>
          <div>
            <dl className={s.same__rows}>
              {costRows.map((r) => (
                <div key={r.label} className={`${s.same__row} ${'ours' in r && r.ours ? s['same__row--ours'] : ''}`}>
                  <dt><span>{r.label}</span><small className="muted">{r.sub}</small></dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
            <p className={`${s.same__src} muted`}>{costSource}</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="ramp-title">
        <div className="container">
          <p className="eyebrow">Ramp</p>
          <h2 id="ramp-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>First commit in about two weeks.</h2>
          <ol role="list" className={s.ramp}>
            {ramp.map((r, i) => (
              <li key={r.t} data-reveal style={{ '--reveal-i': i } as CSSProperties}><span className={`${s.ramp__t} mono`}>{r.t}</span><p>{r.d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section on-paper-2" aria-labelledby="nfaq-title">
        <div className={`container ${s.nfaq}`}>
          <h2 id="nfaq-title" className="h2">Before you ask.</h2>
          <dl>
            {nearFaq.map((f) => <div key={f.q}><dt>{f.q}</dt><dd className="muted">{f.a}</dd></div>)}
          </dl>
        </div>
      </section>

      <FinalCta title="Add a senior engineer in two weeks." text="Tell us about your stack, your team and your cadence. We'll tell you honestly whether a dedicated seat or a sprint fits better, and when someone could start." />
    </>
  );
}
