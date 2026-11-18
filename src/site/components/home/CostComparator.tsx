'use client';

import { useState, type CSSProperties } from 'react';
import { compare, RATES, usd, type Range } from '../../lib/cost';
import { nearshoreFacts, costSource } from '../../content/nearshore';
import Button from '../Button';
import s from './CostComparator.module.css';

const pct = (n: number) => `${((n / RATES.agencyMax) * 100).toFixed(1)}%`;
const fmt = (r: Range) => (r.min === r.max ? usd(r.min) : `${usd(r.min)}–${usd(r.max)}`);
const bars = [
  { key: 'agency', label: 'US agency', min: RATES.agencyMin, max: RATES.agencyMax },
  { key: 'inhouse', label: 'In-house hire', min: RATES.inhouseMin, max: RATES.inhouseMax },
  { key: 'ours', label: 'E-commetrics', min: RATES.ours, max: RATES.ours },
] as const;

export default function CostComparator({ showFacts = true }: { showFacts?: boolean }) {
  const [eng, setEng] = useState(1);
  const [mo, setMo] = useState(6);
  const r = compare(eng, mo);
  const engLabel = `${r.engineers} engineer${r.engineers > 1 ? 's' : ''}`;

  return (
    <section className={`${s.compare} section on-dark`} aria-labelledby="compare-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="eyebrow">Nearshore, priced in the open</p>
            <h2 id="compare-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Nearshore, without the asterisks.</h2>
          </div>
          <p className="lead">
            The same senior engineer, three ways to pay for one. Move the sliders to see what a team would cost
            over the time you actually need it.
          </p>
        </header>

        <div className={s.compare__grid}>
          <form className={s.calc} aria-label="Engineering cost comparison" onSubmit={(e) => e.preventDefault()}>
            <div className={s.calc__inputs}>
              <div className={s.field}>
                <label htmlFor="calc-eng">Engineers</label>
                <output htmlFor="calc-eng">{r.engineers}</output>
                <input id="calc-eng" type="range" min={1} max={5} step={1} value={eng} aria-valuetext={engLabel} onChange={(e) => setEng(+e.target.value)} />
              </div>
              <div className={s.field}>
                <label htmlFor="calc-mo">Months</label>
                <output htmlFor="calc-mo">{r.months}</output>
                <input id="calc-mo" type="range" min={3} max={12} step={1} value={mo} aria-valuetext={`${r.months} months`} onChange={(e) => setMo(+e.target.value)} />
              </div>
            </div>

            <ul className={s.bars} role="list">
              {bars.map((b) => (
                <li key={b.key} className={b.key === 'ours' ? s['bar--ours'] : undefined}>
                  <div className={s.bar__head}>
                    <span className={s.bar__label}>{b.label}</span>
                    <span className={s.bar__value}>{fmt(r[b.key])}</span>
                  </div>
                  <div className={s.bar__track} aria-hidden="true">
                    <span className={s.bar__fill} style={{ '--from': pct(b.min), '--to': pct(b.max) } as CSSProperties} />
                  </div>
                </li>
              ))}
            </ul>

            <p className={s.calc__save} aria-live="polite">
              Versus an in-house hire, you keep
              <strong>{fmt(r.savingsVsInhouse)}</strong>
              over <span>{engLabel}, {r.months} months</span>.
            </p>
            <p className={s.calc__note}>{costSource} 2.3× below an in-house hire, 4.6× below a US agency.</p>
          </form>

          {showFacts && (
            <aside className={s.facts} aria-labelledby="facts-title">
              <h3 id="facts-title" className={s.facts__title}>What nearshore means here</h3>
              <p className={`${s.facts__sub} muted`}>Thirty minutes from the border.</p>
              <dl>
                {nearshoreFacts.map((f) => (
                  <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
                ))}
              </dl>
              <p className={`muted ${s.facts__text}`}>No handoff lag, no overnight queue, no waiting a day for an answer on a pull request.</p>
              <Button href="/nearshore" variant="secondary">How nearshore works</Button>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
