import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import PageHero from '@/site/components/PageHero';
import Button from '@/site/components/Button';
import Icon from '@/site/components/Icon';
import FinalCta from '@/site/components/FinalCta';
import JsonLd from '@/site/components/JsonLd';
import { services, getService, fromLabel } from '@/site/content/services';
import { site } from '@/site/config/site';
import { serviceJsonLd, breadcrumbJsonLd, orgJsonLd } from '@/site/lib/schema';
import { pageMeta } from '@/site/lib/meta';
import s from './page.module.css';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return services.map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: Props) {
  const sv = getService((await params).slug);
  return sv ? pageMeta({ title: sv.seo.title, description: sv.seo.description, path: `/services/${sv.slug}`, og: sv.slug }) : {};
}

export default async function ServicePage({ params }: Props) {
  const sv = getService((await params).slug);
  if (!sv) notFound();
  const path = `/services/${sv.slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/#services' },
    { name: sv.name, path },
  ];
  const others = services.filter((o) => o.slug !== sv.slug);
  const book = `${site.bookingHref}?service=${sv.slug}`;

  return (
    <>
      <JsonLd data={[orgJsonLd(), serviceJsonLd(sv), breadcrumbJsonLd(crumbs)]} />
      <PageHero eyebrow={sv.tags} title={sv.name} lead={sv.promise} crumbs={crumbs}>
        <Button href={book} size="lg">{site.bookingLabel}</Button>
        <Button href="#prices" variant="secondary" size="lg" icon={null}>{sv.fromPrice === null ? 'How pricing works' : fromLabel(sv).replace('from', 'From')}</Button>
      </PageHero>

      <section className="section" aria-labelledby="problem-title">
        <div className={`container ${s.problem__grid}`}>
          <div>
            <p className="eyebrow">{sv.audience}</p>
            <h2 id="problem-title" className="h3" style={{ marginTop: 'var(--s-4)' }}>Why it matters</h2>
          </div>
          <p className={s.problem__text} data-reveal>{sv.body.problem}</p>
        </div>
      </section>

      <section className="section on-white" aria-labelledby="approach-title">
        <div className="container">
          <header className="section-head section-head--split">
            <div>
              <p className="eyebrow">How we do it</p>
              <h2 id="approach-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>The work, step by step.</h2>
            </div>
            <p className="lead">{sv.outcome}</p>
          </header>
          <ol role="list" className={s.approach}>
            {sv.body.approach.map((a, i) => (
              <li key={a.title} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
                <span className={`${s.approach__n} mono`}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={s.approach__t}>{a.title}</h3>
                <p className="muted">{a.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="prices" className="section" aria-labelledby="deliver-title">
        <div className={`container ${s.deliver}`}>
          <div>
            <p className="eyebrow">What you get</p>
            <h2 id="deliver-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Deliverables you keep.</h2>
            <ul role="list" className={s.checks}>
              {sv.body.deliverables.map((d) => <li key={d}><Icon name="check" size={20} />{d}</li>)}
            </ul>
          </div>
          <aside className={`${s.prices} on-indigo`} aria-labelledby="prices-title">
            <h3 id="prices-title" className={s.prices__title}>Published prices</h3>
            <p className={`muted ${s.prices__sub}`}>{sv.fromPrice === null ? 'USD. Websites and stores get a fixed quote after the free diagnosis; web apps run in two-week sprints.' : 'USD. Fixed against the stated scope; anything beyond it is quoted first.'}</p>
            <dl>
              {sv.items.map((it) => <div key={it.label}><dt>{it.label}</dt><dd>{it.price}</dd></div>)}
            </dl>
            <Button href={book} variant="light">{site.bookingLabel}</Button>
          </aside>
        </div>
      </section>

      <section className="section on-paper-2" aria-labelledby="related-title">
        <div className="container">
          <h2 id="related-title" className="eyebrow">Often paired with</h2>
          <ul role="list" className={s.related}>
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/services/${o.slug}`}>
                  <Icon name={o.icon} size={22} />
                  <span className={s.related__name}>{o.name}</span>
                  <span className={`${s.related__aud} muted`}>{o.audience}</span>
                  <span className={s.related__price}>{fromLabel(o)} <Icon name="arrow-right" size={16} /></span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/nearshore">
                <Icon name="users" size={22} />
                <span className={s.related__name}>Nearshore engineers</span>
                <span className={`${s.related__aud} muted`}>For teams that need more hands</span>
                <span className={s.related__price}>$5,200/mo <Icon name="arrow-right" size={16} /></span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <FinalCta title={sv.slug === 'accessibility-compliance' ? 'Know your exposure before a demand letter does.' : 'Tell us the problem. We’ll show you the fix.'} />
    </>
  );
}
