import { work } from '../../content/work';
import Icon from '../Icon';
import s from './Work.module.css';

export default function Work() {
  return (
    <section id="work" className="section on-white" aria-labelledby="work-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="eyebrow">Work</p>
            <h2 id="work-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>Work, not a logo wall.</h2>
          </div>
          <p className="lead">Real sites and systems, with what we did on each. Live projects link to the site so you can check our work yourself.</p>
        </header>

        <ol className={s.list} role="list">
          {work.map((w, i) => (
            <li key={w.name} className={s.row} data-reveal>
              <span className={`${s.row__i} mono`}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className={s.row__name}>
                  {w.url ? (
                    <a href={w.url} rel="noopener" target="_blank">
                      {w.name}
                      <Icon name="arrow-up-right" size={22} />
                      <span className="visually-hidden">(opens {new URL(w.url).hostname} in a new tab)</span>
                    </a>
                  ) : w.name}
                </h3>
                <p className={`${s.row__industry} mono`}>{w.industry}</p>
              </div>
              <p className={s.row__summary}>{w.summary}</p>
              <div className={s.row__meta}>
                <ul role="list" className={s.row__scope} aria-label="Scope">
                  {w.scope.map((x) => <li key={x} className="tag">{x}</li>)}
                </ul>
                <p className={`${s.row__stack} muted`}>{w.stack.join(' · ')}</p>
                {w.result && <p><strong>{w.result}</strong> <span className="muted">{w.resultSource}</span></p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
