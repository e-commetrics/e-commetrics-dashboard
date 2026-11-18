import PageHero from '@/site/components/PageHero';
import BriefForm from '@/site/components/BriefForm';
import Icon from '@/site/components/Icon';
import JsonLd from '@/site/components/JsonLd';
import { site, telHref } from '@/site/config/site';
import { breadcrumbJsonLd, orgJsonLd } from '@/site/lib/schema';
import { pageMeta } from '@/site/lib/meta';
import s from './page.module.css';

export const metadata = pageMeta({
  title: 'Book a Free Diagnosis',
  description: 'Book a free 20-minute diagnosis with a senior engineer: tell us the business problem and we’ll tell you what would solve it. Reply within one business day, Pacific time.',
  path: '/book',
});

const crumbs = [{ name: 'Home', path: '/' }, { name: 'Book a diagnosis', path: '/book' }];
const steps = [
  { t: 'Send the brief', d: 'Two minutes. Tell us what’s going on; skip anything you’re not sure about.' },
  { t: 'We confirm a time', d: 'A senior engineer replies within one business day with times in Pacific time.' },
  { t: '20-minute diagnosis', d: 'We look at your site and systems together, name what’s holding you back, and tell you what solving it would cost.' },
];

export default function BookPage() {
  return (
    <>
      <JsonLd data={[orgJsonLd(), breadcrumbJsonLd(crumbs)]} />
      <PageHero
        eyebrow="Free · 20 minutes · no obligation"
        title="Book a free diagnosis."
        lead="Tell us the problem your website should be solving. A senior engineer, not a sales rep, will reply within one business day."
        crumbs={crumbs}
      />

      <section className="section" aria-label="Project brief">
        <div className={`container ${s.book__grid}`}>
          <div className={s.book__form}>
            <h2 className="h3">Your brief</h2>
            <p className="muted" style={{ marginBlock: 'var(--s-2) var(--s-6)' }}>Fields marked * are required.</p>
            <BriefForm />
          </div>
          <aside className={s.book__side} aria-labelledby="next-title">
            <h2 id="next-title" className="h3">What happens next</h2>
            <ol role="list" className={s.next}>
              {steps.map((st, i) => (
                <li key={st.t}><span className={`${s.next__n} mono`}>{i + 1}</span><div><p className={s.next__t}>{st.t}</p><p className="muted">{st.d}</p></div></li>
              ))}
            </ol>
            {/* Reserved for booking through the E-commetrics dashboard. TODO(later): swap for the booking widget or link. */}
            <div className={s.slot}>
              <Icon name="clock" size={22} />
              <div>
                <p className={s.next__t}>Picking a time</p>
                <p className="muted">Send the brief and we’ll confirm a time for your diagnosis by email within one business day, in Pacific time.</p>
              </div>
            </div>
            <div className={s.direct}>
              <p className={s.next__t}>Prefer email or a call?</p>
              <a href={`mailto:${site.email}`}><Icon name="mail" size={18} />{site.email}</a>
              {site.phone && <a href={telHref(site.phone)}><Icon name="phone" size={18} />{site.phone}</a>}
              <p className="muted">NDA on request, before you share anything sensitive.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
