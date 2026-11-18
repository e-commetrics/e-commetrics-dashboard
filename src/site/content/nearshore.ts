/** Nearshore capacity and agency terms, from the services sheet (2026). */

export const engagements = [
  {
    id: 'seat',
    name: 'Dedicated seat',
    badge: 'Our core capability',
    meta: 'Minimum 3 months',
    priceLabel: 'Per engineer',
    price: '$5,200',
    per: '/mo',
    text: 'A named senior engineer working inside your process: your standups, your board, your repo. Scales by adding seats rather than renegotiating scope. Not shared studio time.',
    whiteLabel: 'White-label: $4,160/mo',
  },
  {
    id: 'sprint',
    name: 'Sprint',
    badge: null,
    meta: '2 weeks · minimum 2 sprints',
    priceLabel: 'Per sprint',
    price: '$7,200',
    per: '',
    text: 'Roadmap agreed up front, a shipped increment at the end of each sprint. Stop after any sprint: no annual commitment and no mid-build scope renegotiation. One engineer over two weeks; multi-engineer sprints quoted per seat.',
    whiteLabel: 'White-label: $5,760 per sprint',
  },
] as const;

export const nearshoreFacts = [
  { label: 'Time zone', value: 'Pacific, full overlap' },
  { label: 'Standups and demos', value: 'Live, your hours' },
  { label: 'Feedback cycle', value: 'Same day' },
  { label: 'On-site in San Diego', value: 'Available' },
  { label: 'Contracts and invoicing', value: 'USD' },
  { label: 'Ramp to first commit', value: '~2 weeks' },
] as const;

export const costRows = [
  { label: 'US agency', sub: '$150–$250/hr × 160 hrs', value: '$24,000–$40,000/mo' },
  { label: 'In-house hire', sub: 'fully loaded, incl. benefits', value: '$12,000–$18,000/mo' },
  { label: 'E-commetrics nearshore', sub: 'senior, Pacific time, on-site', value: '$5,200/mo', ours: true },
] as const;

export const costSource =
  'Comparison figures are published 2026 US market ranges (San Diego) for senior software engineering, shown for context.';

export const agencyTerms = [
  { label: 'Fixed-scope products', value: '25% off' },
  { label: 'Nearshore capacity', value: '20% off' },
] as const;
