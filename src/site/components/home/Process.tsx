import type { CSSProperties } from 'react';
import { process } from '../../content/process';
import s from './Process.module.css';

export default function Process() {
  return (
    <section className="section" aria-labelledby="process-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="process-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>From first call to shipped.</h2>
          </div>
          <p className="lead">Four steps, the same every time. You always know what happens next and what it costs.</p>
        </header>

        <div className={s['steps-wrap']}>
          <span className={s.steps__line} aria-hidden="true"><span /></span>
          <ol className={s.steps} role="list">
            {process.map((p, i) => (
              <li key={p.n} className={s.step} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
                <span className={s.step__n}>{p.n}</span>
                <p className={`${s.step__meta} mono`}>{p.meta}</p>
                <h3 className={s.step__title}>{p.title}</h3>
                <p className="muted">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
