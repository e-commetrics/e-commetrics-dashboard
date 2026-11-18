import { site } from '../../config/site';
import s from './About.module.css';

const compare = [
  { k: 'Who does the work', us: 'Senior engineers, with the founder on every project', them: 'A senior pitch, then a junior team after signing' },
  { k: 'Where it starts', us: 'Your business problem and its numbers', them: 'A package, a template or a redesign' },
  { k: 'How it’s priced', us: 'Published, or fixed in writing before we start', them: 'Hourly, typically $150–$250 an hour' },
  { k: 'Accessibility & security', us: 'Built into every project', them: 'Often sold as an add-on' },
  { k: 'Commitment', us: 'Stop after any sprint', them: 'Retainers and long contracts' },
];
const principles = [
  { t: 'Start with the problem.', d: 'Nothing gets designed until we know what the website has to fix, and how we’ll know it worked.' },
  { t: 'Publish the price.', d: 'You see the number before the call. Scope changes get quoted before they get built.' },
  { t: 'Build it in, not on.', d: 'Speed, accessibility and security are engineered into the code, never bolted on afterwards.' },
];
const stack = ['React', 'Next.js', 'Astro', 'TypeScript', 'Node.js', 'WordPress', 'Shopify', 'REST & GraphQL APIs', 'GA4 / GTM', 'Cloudflare', 'cPanel', 'Google Workspace'];

export default function About() {
  return (
    <section id="about" className={`${s.about} section on-indigo`} aria-labelledby="about-title">
      <div className={`container ${s.about__grid}`}>
        <figure className={s.about__visual}>
          <div className={s.frame}>
            {/* Static export: next/image can't optimize, so the WebP is pre-sized (840px wide). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/founder.webp"
              width={840}
              height={1050}
              alt={`${site.founder.name}, ${site.founder.role.toLowerCase()} of E-commetrics`}
              loading="lazy"
              className={s.frame__img}
            />
          </div>
          <blockquote className={s.founder__quote}>
            <p>
              “Every business wants to grow so it can last. A website should carry that intent: reach the right people,
              earn a place in the market, open new ways to sell, and keep customers coming back. I founded E-commetrics
              to build exactly that, held to the standard I’d want for my own company.”
            </p>
          </blockquote>
          <figcaption className={s.frame__cap}>
            <span className={s.frame__name}>{site.founder.name}</span>
            <span className="mono">{site.founder.role} · Tijuana ⇄ San Diego</span>
          </figcaption>
        </figure>

        <div>
          <p className="eyebrow">About E-commetrics</p>
          <h2 id="about-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Senior by default. Founder-led on purpose.</h2>
          <p className={s.about__intro}>
            E-commetrics is a web development firm founded by {site.founder.name}, a Mexican engineer working
            with entrepreneurs and small to mid-size companies across North America and beyond. We stay small by
            choice: the person who diagnoses your problem is the person who builds the solution.
          </p>

          <div className={s.cmp} role="region" aria-labelledby="cmp-cap" tabIndex={0}>
            <table>
              <caption id="cmp-cap">How we compare with a typical large agency</caption>
              <thead>
                <tr><th scope="col"><span className="visually-hidden">Aspect</span></th><th scope="col">E-commetrics</th><th scope="col">Typical large agency</th></tr>
              </thead>
              <tbody>
                {compare.map((r) => (
                  <tr key={r.k}><th scope="row">{r.k}</th><td className={s.cmp__us}>{r.us}</td><td className={s.cmp__them}>{r.them}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul role="list" className={s.principles}>
            {principles.map((p) => (
              <li key={p.t}><h3>{p.t}</h3><p className="muted">{p.d}</p></li>
            ))}
          </ul>

          <ul role="list" className={s.stack} aria-label="Technologies we work with">
            {stack.map((x) => <li key={x} className="tag">{x}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
