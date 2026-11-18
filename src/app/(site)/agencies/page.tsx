import type { CSSProperties } from 'react';
import PageHero from '@/site/components/PageHero';
import Button from '@/site/components/Button';
import Icon from '@/site/components/Icon';
import FinalCta from '@/site/components/FinalCta';
import JsonLd from '@/site/components/JsonLd';
import { getService } from '@/site/content/services';
import { site } from '@/site/config/site';
import { breadcrumbJsonLd, orgJsonLd } from '@/site/lib/schema';
import { pageMeta } from '@/site/lib/meta';
import s from './page.module.css';

export const metadata = pageMeta({
  title: 'White-label Web Engineering for Agencies',
  description: 'Subcontract accessibility audits, remediation, integrations and engineering capacity under your brand. NDA standard, 25% off fixed-scope work, 20% off nearshore capacity.',
  path: '/agencies',
  og: 'agencies',
});

const crumbs = [{ name: 'Home', path: '/' }, { name: 'Agency / white-label', path: '/agencies' }];
const rates = [
  { label: 'Fixed-scope products', value: '25% off', note: 'Every service at published price, less 25%' },
  { label: 'Dedicated seat', value: '$4,160/mo', note: 'Per engineer, minimum 3 months' },
  { label: 'Sprint', value: '$5,760', note: 'Per two-week sprint, minimum 2' },
];
const how = [
  { icon: 'lock', t: 'NDA by default', d: 'Signed before we see your client’s name. Your client relationship stays yours.' },
  { icon: 'doc', t: 'Unbranded deliverables', d: 'Audits, reports, VPATs and code delivered under your brand, ready to send.' },
  { icon: 'users', t: 'Inside your process', d: 'We join your PM tool, your Slack and your client calls as part of your team, if you want us there.' },
  { icon: 'clock', t: 'Pacific time', d: 'Same-day turnaround on review comments, so your client never waits on a time zone.' },
] as const;
// The Astro page used the lead service (web development) here, under a compliance heading.
const lead = getService('accessibility-compliance')!;

export default function AgenciesPage() {
  return (
    <>
      <JsonLd data={[orgJsonLd(), breadcrumbJsonLd(crumbs)]} />
      <PageHero
        eyebrow="Agency / white-label program"
        title="Your brand on the work. Our engineers behind it."
        lead="Sell accessibility compliance, integrations and senior engineering capacity without hiring for them. We build under your brand; your client never sees our name."
        crumbs={crumbs}
      >
        <Button href={site.bookingHref} size="lg">Talk partnership</Button>
      </PageHero>

      <section className="section" aria-labelledby="rates-title">
        <div className="container">
          <header className="section-head section-head--split">
            <div>
              <p className="eyebrow">Partner rates</p>
              <h2 id="rates-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Margin built in.</h2>
            </div>
            <p className="lead">25% off fixed-scope products, 20% off nearshore capacity. Your markup is yours; we never quote your client directly.</p>
          </header>
          <dl className={s.rates}>
            {rates.map((r, i) => (
              <div key={r.label} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
                <dt>{r.label}</dt>
                <dd className={s.rates__v}>{r.value}</dd>
                <dd className={`muted ${s.rates__n}`}>{r.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section on-white" aria-labelledby="how-title">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Invisible by design.</h2>
          <ul role="list" className={s.how}>
            {how.map((h) => (
              <li key={h.t}><Icon name={h.icon} size={24} /><h3>{h.t}</h3><p className="muted">{h.d}</p></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section on-indigo" aria-labelledby="most-title">
        <div className={`container ${s.most}`}>
          <div>
            <p className="eyebrow">Most subcontracted</p>
            <h2 id="most-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Compliance is the line agencies hand us most.</h2>
            <p className="lead" style={{ marginTop: 'var(--s-5)' }}>Your clients are asking about ADA and WCAG. Few agencies have someone who can test with a screen reader, fix the code and write the VPAT. We do.</p>
            <div style={{ marginTop: 'var(--s-6)' }}><Button href={`/services/${lead.slug}`} variant="light">See the compliance service</Button></div>
          </div>
          <div>
            <dl className={s.most__prices}>
              {lead.items.map((it) => <div key={it.label}><dt>{it.label}</dt><dd>{it.price}</dd></div>)}
            </dl>
            <p className={`muted ${s.most__note}`}>Published prices shown; partners pay 25% less.</p>
          </div>
        </div>
      </section>

      <FinalCta title="Add a senior engineering team to your agency. Without the payroll." text="Tell us what your clients are asking for. We'll set up partner pricing, an NDA and a first project." />
    </>
  );
}
