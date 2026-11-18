import type { Testimonial } from './types';

/**
 * TODO(owner): replace with real client quotes, used with permission, then set approved: true.
 * Unapproved entries render only in `bun run dev` (with a DRAFT badge) and never in the production build.
 */
export const testimonials: Testimonial[] = [
  {
    quote:
      'Placeholder. Replace with a real quote about what changed after working with E-commetrics: what was broken, what got fixed, and what it meant for the business.',
    name: 'Client name',
    role: 'Role',
    company: 'Company',
    approved: false,
  },
  {
    quote:
      'Placeholder. A second real quote, ideally from an agency partner or an engineering lead, about working on Pacific time with a nearshore engineer.',
    name: 'Client name',
    role: 'Role',
    company: 'Company',
    approved: false,
  },
];
