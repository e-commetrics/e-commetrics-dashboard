import type { CSSProperties } from 'react';
import { testimonials } from '../../content/testimonials';
import { visibleTestimonials } from '../../lib/testimonials';
import s from './Testimonials.module.css';

export default function Testimonials() {
  const list = visibleTestimonials(testimonials, process.env.NODE_ENV !== 'production');
  if (list.length === 0) return null;
  return (
    <section className="section" aria-labelledby="quotes-title">
      <div className="container">
        <p className="eyebrow" id="quotes-title">In their words</p>
        <ul role="list" className={s.quotes__list}>
          {list.map((t, i) => (
            <li key={i} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
              <figure className={`${s.quote} ${t.approved ? '' : s['quote--draft']}`}>
                {!t.approved && <span className={`${s.quote__draft} mono`}>DRAFT · not shown in production</span>}
                <blockquote>
                  <p>“{t.quote}”</p>
                </blockquote>
                <figcaption>
                  <span className={s.quote__name}>{t.name}</span>
                  <span className="muted">{t.role}, {t.company}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
