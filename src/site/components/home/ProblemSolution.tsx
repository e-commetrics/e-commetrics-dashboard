import type { CSSProperties } from 'react';
import s from './ProblemSolution.module.css';

/**
 * Hero visual: business problems resolving into what we build.
 * Pure CSS; the sequence plays once (~4 s) and rests on the solved state.
 */
const rows = [
  { problem: 'Leads fill out a form and wait for days.', solution: 'Forms wired to your CRM, with instant alerts.', tag: 'Integrations' },
  { problem: 'The site crawls on phones and loses buyers.', solution: 'A fast, mobile-first rebuild that converts.', tag: 'Web development' },
  { problem: 'Nobody finds the business on Google.', solution: 'Technical SEO and pages search engines can read.', tag: 'SEO & AEO' },
  { problem: 'Monthly numbers arrive a month late.', solution: 'One live dashboard of the numbers that matter.', tag: 'Dashboards' },
];

export default function ProblemSolution() {
  return (
    <figure className={s.ps} aria-labelledby="ps-cap">
      <figcaption id="ps-cap" className={s.ps__head}>
        <span className={s.ps__dot} aria-hidden="true" />
        <span className="mono">Diagnosis</span>
        <span className={`${s.ps__count} mono`} aria-hidden="true">
          <span className={s.ps__open}>4 problems</span>
          <span className={s.ps__done}>4 solved</span>
        </span>
      </figcaption>
      <ol className={s.ps__list} role="list">
        {rows.map((r, i) => (
          <li key={r.tag} className={s.row} style={{ '--d': i } as CSSProperties}>
            <p className={s.row__problem}>
              <span className="visually-hidden">Problem: </span>
              <span className={s.row__strike}>{r.problem}</span>
            </p>
            <p className={s.row__solution}>
              <span className={s.row__arrow} aria-hidden="true">→</span>
              <span><span className="visually-hidden">Solution: </span>{r.solution}</span>
            </p>
            <span className={`${s.row__tag} mono`} aria-hidden="true">{r.tag}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
