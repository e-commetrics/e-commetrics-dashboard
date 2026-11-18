import { site, telHref } from '../config/site';
import type { FaqItem, Service } from '../content/types';

const abs = (path: string) => new URL(path, site.url).href;
const ORG_ID = `${site.url}/#organization`;

const areaServed = [
  { '@type': 'AdministrativeArea', name: 'San Diego County, California' },
  { '@type': 'State', name: 'California' },
  { '@type': 'Country', name: 'United States' },
  { '@type': 'Country', name: 'Canada' },
  { '@type': 'Country', name: 'Mexico' },
];

export function orgJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: site.name,
    url: site.url,
    logo: abs('/favicon.svg'),
    image: abs('/og/home.png'),
    email: site.email,
    ...(site.phone ? { telephone: telHref(site.phone).slice(4) } : {}),
    founder: {
      '@type': 'Person',
      name: site.founder.name,
      jobTitle: site.founder.role,
      nationality: { '@type': 'Country', name: 'Mexico' },
    },
    description:
      'Web development firm for entrepreneurs and small to mid-size companies across North America: websites, e-commerce and web apps built around a business problem, plus integrations, dashboards, technical SEO, accessibility, infrastructure and nearshore senior engineers on Pacific time.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    areaServed,
    priceRange: '$$',
    currenciesAccepted: 'USD',
    knowsAbout: ['Web accessibility', 'WCAG', 'ADA compliance', 'CCPA', 'Next.js', 'Astro', 'React', 'Technical SEO', 'Email deliverability'],
  };
}

export function serviceJsonLd(s: Service): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    serviceType: s.name,
    description: s.promise,
    url: abs(`/services/${s.slug}`),
    provider: { '@id': ORG_ID },
    areaServed,
    ...(s.fromPrice !== null
      ? { offers: { '@type': 'Offer', price: String(s.fromPrice), priceCurrency: 'USD' } }
      : {}),
  };
}

export function faqJsonLd(items: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path) })),
  };
}
