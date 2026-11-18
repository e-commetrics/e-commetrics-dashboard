import type { CSSProperties } from 'react';
import { clientTypes, clientProfile } from '../../content/clients';
import s from './Proof.module.css';

const stats = [
  { value: '$5,200', unit: '/mo', label: 'A senior engineer on Pacific time, versus $12k–$18k for an in-house hire' },
  { value: '0', unit: 'h', label: 'Time-zone gap with California. Standups and demos run in your hours.' },
  { value: '~2', unit: 'wks', label: 'From signed scope to first commit in your repository' },
  // The Astro site's "5.5 KB of JavaScript" stat was dropped: it isn't true of the Next build.
];

export default function Proof() {
  return (
    <section className={s.proof} aria-labelledby="proof-title">
      <div className="container">
        <div className={s.proof__names}>
          <div>
            <h2 id="proof-title" className="eyebrow">Who we work with</h2>
            <p className={s.proof__profile}>{clientProfile}</p>
          </div>
          <ul role="list">
            {clientTypes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>

        <dl className={s.proof__stats}>
          {stats.map((st, i) => (
            <div key={st.label} className={s.stat} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
              <dt className={s.stat__label}>{st.label}</dt>
              <dd className={s.stat__value}>{st.value}<span>{st.unit}</span></dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
