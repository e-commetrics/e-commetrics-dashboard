import { faq } from '../../content/faq';
import { site } from '../../config/site';
import Icon from '../Icon';
import s from './Faq.module.css';

export default function Faq() {
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className={`container ${s.faq__grid}`}>
        <div className={s.faq__head}>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="h2" style={{ marginTop: 'var(--s-5)' }}>The questions buyers ask before they book.</h2>
          <p className={`muted ${s.faq__alt}`}>
            Something else? Email <a href={`mailto:${site.email}`}>{site.email}</a>. A senior engineer answers, not a sales rep.
          </p>
        </div>
        <div className={s.faq__list}>
          {faq.map((f) => (
            <details key={f.q} className={s.qa}>
              <summary>
                <span>{f.q}</span>
                <span className={s.qa__icon} aria-hidden="true"><Icon name="plus" size={18} /></span>
              </summary>
              <div className={s.qa__a}><p>{f.a}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
