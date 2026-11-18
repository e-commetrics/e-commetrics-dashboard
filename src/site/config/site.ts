/**
 * Site-wide settings. Values marked TODO(owner) are placeholders to replace
 * before launch (see docs/superpowers/specs/…-design.md §13).
 */
export const site = {
  name: 'E-commetrics',
  legalName: 'E-commetrics',
  url: 'https://e-commetrics.com',
  tagline: 'Web development that solves real business problems.',
  email: 'hello@e-commetrics.com',
  /** Display format; `tel:` links strip everything but digits and "+". */
  phone: '+1 (619) 632-1264' as string | null,
  founder: {
    name: 'Juan Manuel González Castillo',
    role: 'Founder & lead engineer',
    nationality: 'Mexican',
  },
  address: {
    locality: 'Tijuana',
    region: 'B.C.',
    country: 'MX',
    note: '30 minutes from San Diego · on-site visits available',
  },
  /**
   * Every booking CTA reads this. Booking will move to the E-commetrics
   * dashboard later — change this one value when it does.
   */
  bookingHref: '/book',
  bookingLabel: 'Book a free diagnosis',
  nav: [
    { label: 'Services', href: '/#services' },
    { label: 'Nearshore', href: '/nearshore' },
    { label: 'Work', href: '/#work' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
  ],
  /** TODO(owner): real profile URLs. Empty hrefs are not rendered. */
  social: [
    { label: 'LinkedIn', href: '' },
    { label: 'GitHub', href: '' },
  ],
} as const;

export type Site = typeof site;

/** "+1 (619) 632-1264" → "tel:+16196321264" */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
