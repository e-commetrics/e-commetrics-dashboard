import type { CSSProperties } from 'react';
import s from './ValueProp.module.css';

const points = [
  { n: '01', title: 'Diagnose the problem', text: 'Lost leads, manual work, a site nobody finds. We measure what’s actually holding the business back before anything gets designed.' },
  { n: '02', title: 'Build the solution', text: 'The website, store, integration or dashboard that fixes it, engineered by the same senior people who scoped it.' },
  { n: '03', title: 'Run it and grow it', text: 'Hosting, monitoring and steady improvements, plus extra engineers by the month when you need more hands.' },
];

export default function ValueProp() {
  return (
    <section className={`${s.value} section`} aria-labelledby="value-title">
      <div className={`container ${s.value__grid}`}>
        <div className={s.value__statement}>
          <p className="eyebrow">How we think</p>
          <h2 id="value-title" className="h2" data-reveal>
            We start with the problem, <span className="accent">not the template.</span>
          </h2>
          <p className={s.value__inherent} data-reveal>
            Accessibility, speed and security aren’t upsells here. They’re part of every build, so the solution
            holds up with search engines, customers and lawyers alike.
          </p>
        </div>
        <ol className={s.value__points} role="list">
          {points.map((p, i) => (
            <li key={p.n} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
              <span className={`${s.value__n} mono`}>{p.n}</span>
              <h3 className={s.value__t}>{p.title}</h3>
              <p className="muted">{p.text}</p>
            </li>
          ))}
        </ol>
      </div>
      <svg className={s.value__mark} viewBox="0 0 32 32" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="0.12" d="M32 22V5a5 5 0 0 0-5-5H5a5 5 0 0 0-5 5v22a5 5 0 0 0 5 5h22a5 5 0 0 0 5-5H5V5h22v12h-6v-6H11v11z" />
      </svg>
    </section>
  );
}
