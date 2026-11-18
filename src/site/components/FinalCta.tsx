import { site } from '../config/site';
import Button from './Button';
import s from './FinalCta.module.css';

export default function FinalCta({
  title = 'Tell us the problem. We’ll show you the fix.',
  text = 'A free 20-minute diagnosis with a senior engineer. You leave knowing what’s holding your website back, what would solve it, and what that would cost. No obligation, no sales script.',
}: { title?: string; text?: string }) {
  return (
    <section className={`${s.final} on-dark`} data-final-cta aria-labelledby="final-title">
      <div className={`container ${s.final__inner}`}>
        <h2 id="final-title" className={`h1 ${s.final__title}`}>{title}</h2>
        <div>
          <p className={s.final__text}>{text}</p>
          <div className={s.final__ctas}>
            <Button href={site.bookingHref} variant="light" size="lg">{site.bookingLabel}</Button>
            <a className={s.final__mail} href={`mailto:${site.email}`}>or email {site.email}</a>
          </div>
          <ul role="list" className={`${s.final__terms} mono`}>
            <li>Reply within one business day</li>
            <li>Pacific time</li>
            <li>NDA on request</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
