import { describe, it, expect } from 'bun:test';
import { visibleTestimonials } from '../lib/testimonials';
import type { Testimonial } from '../content/types';

const base = { quote: 'q', name: 'n', role: 'r', company: 'c' };
const list: Testimonial[] = [
  { ...base, name: 'approved', approved: true },
  { ...base, name: 'draft', approved: false },
];

describe('visibleTestimonials', () => {
  it('ships only approved testimonials in production', () => {
    expect(visibleTestimonials(list, false).map((t) => t.name)).toEqual(['approved']);
  });
  it('shows drafts in development', () => {
    expect(visibleTestimonials(list, true)).toHaveLength(2);
  });
});
