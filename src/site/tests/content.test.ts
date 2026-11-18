import { describe, it, expect } from 'bun:test';
import { services, getService } from '../content/services';
import { faq } from '../content/faq';
import { work } from '../content/work';

describe('services content', () => {
  it('leads with web development, followed by the five specialist services', () => {
    const slugs = services.map((s) => s.slug);
    expect(slugs).toEqual([
      'web-development',
      'system-integrations',
      'dashboards-bi',
      'technical-seo-aeo',
      'accessibility-compliance',
      'infrastructure',
    ]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it('marks web development as the only lead offer', () => {
    expect(services.filter((s) => s.lead).map((s) => s.slug)).toEqual(['web-development']);
  });
  it('carries the published prices and never invents one', () => {
    const a11y = getService('accessibility-compliance')!;
    expect(a11y.items.find((i) => i.label.startsWith('Audit'))?.price).toBe('$1,890');
    expect(a11y.fromPrice).toBe(1890);
    // Web development has no published fixed price: it is quoted after the diagnosis.
    expect(getService('web-development')!.fromPrice).toBeNull();
    expect(services.every((s) => s.items.length > 0 && (s.fromPrice === null || s.fromPrice > 0))).toBe(true);
  });
});

describe('other content', () => {
  it('has FAQ entries with question and answer', () => {
    expect(faq.length).toBeGreaterThanOrEqual(6);
    expect(faq.every((f) => f.q.endsWith('?') && f.a.length > 40)).toBe(true);
  });
  it('shows only the confirmed client projects', () => {
    expect(work.map((w) => w.name)).toEqual(['ScanEat', 'Central Toreo', 'Excellentia Foods']);
  });
  it('never invents metrics: results are optional and sourced', () => {
    expect(work.every((w) => !w.result || w.resultSource)).toBe(true);
  });
});
