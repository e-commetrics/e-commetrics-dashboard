import { site } from '../../config/site';
import { work } from '../../content/work';
import Button from '../Button';
import Icon from '../Icon';
import ProblemSolution from './ProblemSolution';
import s from './Hero.module.css';

const terms = ['Prices published', 'Pacific time', 'NDA standard', 'Accessible by default'];

export default function Hero() {
  return (
    <section className={`${s.hero} on-dark`} aria-labelledby="hero-title">
      <div className={s.hero__grid} aria-hidden="true" />
      <div className="container">
        <div className={s.hero__split}>
          <div>
            <p className="eyebrow">Web development firm · San Diego &amp; Tijuana</p>
            <h1 id="hero-title" className={s.hero__title}>
              Web development that <span className="accent">solves</span> real business problems.
            </h1>
            <p className={s.hero__lead}>
              E-commetrics designs, builds and runs websites, online stores and web apps for entrepreneurs and
              growing companies. We find what’s holding the business back, then engineer what fixes it.
            </p>
            <div className={s.hero__ctas}>
              <Button href={site.bookingHref} size="lg">{site.bookingLabel}</Button>
              <Button href="/#work" variant="secondary" size="lg" icon={null}>See our work</Button>
            </div>
          </div>
          <div>
            <ProblemSolution />
          </div>
        </div>

        <div className={s.hero__band}>
          <div className={s.hero__clients}>
            <span className="eyebrow">Trusted by</span>
            <ul role="list">
              {work.map((w) => <li key={w.name}>{w.name}</li>)}
            </ul>
          </div>
          <ul className={s.hero__terms} role="list" aria-label="Working terms">
            {terms.map((t) => <li key={t}><Icon name="check" size={16} />{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
