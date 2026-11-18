import Link from 'next/link';
import { site, telHref } from '../config/site';
import { services } from '../content/services';
import Logo from './Logo';
import Icon from './Icon';
import s from './Footer.module.css';

export default function Footer() {
  const social = site.social.filter((x) => x.href);
  return (
    <footer className={`${s.footer} on-dark`}>
      <div className="container">
        <div className={s.footer__top}>
          <div>
            <Logo className={s.footer__logo} />
            <p className={s.footer__line}>A web development firm for entrepreneurs and small to mid-size companies across North America. We diagnose the problem, then build what solves it.</p>
          </div>

          <nav className={s.footer__cols} aria-label="Footer">
            <div>
              <h2 className={s.footer__h}>Services</h2>
              <ul role="list">
                {services.map((sv) => <li key={sv.slug}><Link href={`/services/${sv.slug}`}>{sv.name}</Link></li>)}
              </ul>
            </div>
            <div>
              <h2 className={s.footer__h}>Work with us</h2>
              <ul role="list">
                <li><Link href="/nearshore">Nearshore engineers</Link></li>
                <li><Link href="/agencies">Agency / white-label</Link></li>
                <li><Link href="/#work">Work</Link></li>
                <li><Link href="/#pricing">Pricing</Link></li>
                <li><Link href="/#faq">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h2 className={s.footer__h}>Contact</h2>
              <ul role="list" className={s.footer__contact}>
                <li><a href={`mailto:${site.email}`}><Icon name="mail" size={16} />{site.email}</a></li>
                {site.phone && <li><a href={telHref(site.phone)}><Icon name="phone" size={16} />{site.phone}</a></li>}
                <li><span><Icon name="pin" size={16} />{site.address.locality}, {site.address.region} · {site.address.note}</span></li>
                <li><Link href={site.bookingHref}><Icon name="arrow-right" size={16} />{site.bookingLabel}</Link></li>
              </ul>
              {social.length > 0 && (
                <ul role="list" className={s.footer__social}>
                  {social.map((x) => <li key={x.label}><a href={x.href} rel="me noopener">{x.label}</a></li>)}
                </ul>
              )}
            </div>
          </nav>
        </div>

        <div className={s.footer__bottom}>
          <p>© {new Date().getFullYear()} {site.legalName}. Prices in USD.</p>
          <ul role="list">
            <li><Link href="/legal/privacy-policy">Privacy</Link></li>
            <li><Link href="/accessibility">Accessibility statement</Link></li>
            <li><Link href="/accessibility">This site is built to WCAG 2.2 AA. Audit it.</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
