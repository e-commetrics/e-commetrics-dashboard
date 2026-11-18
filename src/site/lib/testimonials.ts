import type { Testimonial } from '../content/types';

/** Production shows only approved testimonials; development also shows drafts (badged). */
export function visibleTestimonials(list: Testimonial[], isDev: boolean): Testimonial[] {
  return isDev ? list : list.filter((t) => t.approved);
}
