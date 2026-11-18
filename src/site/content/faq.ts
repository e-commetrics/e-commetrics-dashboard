import type { FaqItem } from './types';

/** TODO(owner): confirm the policy answers (ownership, access, security) match how you work. */
export const faq: FaqItem[] = [
  {
    q: 'How much does a website cost?',
    a: 'Websites and online stores get a fixed quote after the free 20-minute diagnosis, once we know what problem the site has to solve. Web apps and portals run in two-week sprints at $7,200 per sprint. Specialist services like audits, integrations and dashboards have published prices on this page.',
  },
  {
    q: 'Do you only build new websites?',
    a: 'No. Sometimes the right fix is a rebuild; often it is one integration, a faster checkout, a dashboard or proper SEO on the site you already have. The diagnosis decides what to build, not a package.',
  },
  {
    q: 'Which technologies do you use?',
    a: 'React, Next.js and Astro for custom builds; WordPress or Shopify when your team needs to edit content or run a store day to day. We choose the stack that solves your problem and that you can keep running, not the one we happen to prefer.',
  },
  {
    q: 'How do fixed prices stay fixed?',
    a: 'Every fixed price is quoted against a written scope. If something outside that scope comes up, we quote it separately before doing it. Systems without a documented API are always quoted, never fixed-price.',
  },
  {
    q: 'Is my website accessible and compliant?',
    a: 'Everything we build ships to WCAG 2.1 AA with consent and privacy set up correctly, because accessibility is part of the build, not an extra. For an existing site, an audit of up to 12 templates is $1,890 and tells you exactly where you stand. We never use overlay widgets; they do not fix the code underneath.',
  },
  {
    q: 'Is working with a team in Mexico complicated?',
    a: 'It is designed not to be. Contracts and invoicing are in USD, we work on Pacific time with full overlap, standups and demos happen live in your hours, feedback is same-day, and on-site visits in San Diego are available.',
  },
  {
    q: 'Who owns the code, domains and accounts?',
    a: 'You do. Repositories, domains, hosting and third-party accounts live in your name, or are transferred to you at handover, along with documentation and credentials.',
  },
  {
    q: 'What if a sprint does not deliver what we needed?',
    a: 'You can stop after any sprint. There is no annual commitment and no mid-build scope renegotiation. Each sprint ends with a shipped increment, so you always keep what was built.',
  },
  {
    q: 'Can you work under our agency brand?',
    a: 'Yes. White-label is standard: unbranded deliverables, NDA by default, and your client never sees our name. Agencies get 25% off fixed-scope products and 20% off nearshore capacity.',
  },
];
