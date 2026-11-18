/* eslint-disable @typescript-eslint/no-explicit-any -- JSON-LD objects are untyped by design */
import { describe, it, expect } from 'bun:test';
import { orgJsonLd, serviceJsonLd, faqJsonLd, breadcrumbJsonLd } from '../lib/schema';
import { getService } from '../content/services';

describe('JSON-LD', () => {
  it('describes the business as a ProfessionalService serving San Diego', () => {
    const o = orgJsonLd() as any;
    expect(o['@type']).toBe('ProfessionalService');
    expect(o.url).toBe('https://e-commetrics.com');
    expect(JSON.stringify(o.areaServed)).toContain('San Diego');
  });
  it('names the founder and lists phone and email', () => {
    const o = orgJsonLd() as any;
    expect(o.founder).toMatchObject({ '@type': 'Person', name: 'Juan Manuel González Castillo' });
    expect(o.telephone).toBe('+16196321264');
    expect(o.email).toBe('hello@e-commetrics.com');
  });
  it('builds a Service with a USD offer', () => {
    const s = serviceJsonLd(getService('accessibility-compliance')!) as any;
    expect(s['@type']).toBe('Service');
    expect(s.offers.priceCurrency).toBe('USD');
    expect(s.offers.price).toBe('1890');
    expect(s.url).toBe('https://e-commetrics.com/services/accessibility-compliance');
  });
  it('omits the offer for quote-only services', () => {
    const s = serviceJsonLd(getService('web-development')!) as any;
    expect(s.offers).toBeUndefined();
    expect(s.url).toBe('https://e-commetrics.com/services/web-development');
  });
  it('builds FAQPage and BreadcrumbList', () => {
    const f = faqJsonLd([{ q: 'Why?', a: 'Because.' }]) as any;
    expect(f.mainEntity[0].acceptedAnswer.text).toBe('Because.');
    const b = breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'X', path: '/x/' }]) as any;
    expect(b.itemListElement[1]).toMatchObject({ position: 2, item: 'https://e-commetrics.com/x/' });
  });
});
