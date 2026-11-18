export interface PriceItem {
  label: string;
  price: string;
  note?: string;
}

export interface Service {
  slug: string;
  name: string;
  /** Short label line under the name, e.g. "ADA · WCAG 2.1 AA · CCPA/CPRA" */
  tags: string;
  /** "For …" qualifier from the services sheet */
  audience: string;
  /** One-sentence promise */
  promise: string;
  /** The result, stated as an outcome */
  outcome: string;
  icon: 'code' | 'shield' | 'plug' | 'chart' | 'search' | 'server';
  lead?: boolean;
  items: PriceItem[];
  /** Lowest one-off entry price in USD, for "from $X" and JSON-LD. null = quoted after the diagnosis. */
  fromPrice: number | null;
  seo: { title: string; description: string };
  body: {
    problem: string;
    approach: { title: string; text: string }[];
    deliverables: string[];
  };
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  /** Only approved testimonials (real, with permission) ship to production. */
  approved: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface WorkItem {
  name: string;
  url?: string;
  industry: string;
  summary: string;
  scope: string[];
  stack: string[];
  /** A measured outcome. Must come with resultSource. */
  result?: string;
  resultSource?: string;
}
