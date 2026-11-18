import type { Service } from './types';

/**
 * Prices are copied from "Engineering services" (Price Bundles, 2026). USD.
 * Fixed-price items are quoted against the stated scope; work beyond it is quoted separately.
 */
export const services: Service[] = [
  {
    slug: 'web-development',
    name: 'Web Development',
    tags: 'Websites · e-commerce · web apps',
    audience: 'For businesses whose website isn’t doing a job',
    promise: 'A website, store or web app built around the problem your business needs solved.',
    outcome: 'More of the right customers, less manual work, and a site you own completely.',
    icon: 'code',
    lead: true,
    fromPrice: null,
    items: [
      { label: 'Diagnosis — 20 minutes', price: 'free' },
      { label: 'Marketing website', price: 'fixed quote' },
      { label: 'E-commerce store', price: 'fixed quote' },
      { label: 'Web app or client portal', price: '$7,200 / sprint' },
      { label: 'Accessibility, speed & security', price: 'included' },
    ],
    seo: {
      title: 'Custom Web Development for Growing Businesses',
      description:
        'Websites, e-commerce stores and web apps built around a business problem by senior engineers on Pacific time. React, Next.js, Astro, WordPress and Shopify. Free 20-minute diagnosis.',
    },
    body: {
      problem:
        'Most websites exist; few do a job. Leads go nowhere, orders get retyped, pages crawl on phones and nobody finds the business on Google. A redesign that only changes how it looks won’t fix any of that.',
      approach: [
        { title: 'Diagnose', text: 'We start with the business problem and the numbers behind it, then decide what to build. Sometimes that’s a new site; sometimes it’s one integration.' },
        { title: 'Design', text: 'Structure, content and interface designed around the one action you need visitors to take, on your brand.' },
        { title: 'Build', text: 'Engineered in React, Next.js or Astro, or on WordPress or Shopify when your team needs to edit it. Fast, accessible and secure by default.' },
        { title: 'Run', text: 'Hosting, monitoring and steady improvements after launch, or a clean handover with everything in your name.' },
      ],
      deliverables: [
        'Diagnosis summary and a written scope with a fixed price',
        'Design system and page templates on your brand',
        'Production website, store or web app',
        'WCAG 2.1 AA accessibility and Core Web Vitals checked before launch',
        'Analytics and consent configured correctly',
        'Code, domain and accounts in your name',
      ],
    },
  },
  {
    slug: 'system-integrations',
    name: 'System Integrations',
    tags: 'CRM · ERP · payments · scheduling',
    audience: 'For teams re-keying data by hand',
    promise: 'Your systems talk to each other, and stop depending on someone remembering to copy a number.',
    outcome: 'Orders, leads and appointments flow between tools on their own, with logs when something fails.',
    icon: 'plug',
    fromPrice: 2000,
    items: [
      { label: 'One-way sync — documented API', price: 'from $2,650' },
      { label: 'Bidirectional sync', price: 'from $7,500' },
      { label: 'Legacy or undocumented', price: 'quoted' },
      { label: 'Platform APIs — Meta Graph, GBP, GSC', price: '$2,000' },
    ],
    seo: {
      title: 'CRM, ERP & Payment System Integrations',
      description:
        'Connect your CRM, ERP, payments and scheduling tools. One-way syncs from $2,650, bidirectional from $7,500. Documented, logged, and owned by you.',
    },
    body: {
      problem:
        'When the website, CRM, payment processor and scheduling tool don’t share data, people do it by hand. That costs hours every week, and every manual copy is a chance to get a price, a date or a customer wrong.',
      approach: [
        { title: 'Map', text: 'We trace every place data is re-typed today and agree on one source of truth per field.' },
        { title: 'Connect', text: 'Integrations against documented APIs, with retries, idempotency and alerting. Undocumented or legacy systems are always quoted, never guessed.' },
        { title: 'Prove', text: 'Test runs against real records, a run log you can read, and a rollback plan before anything goes live.' },
      ],
      deliverables: [
        'Data-flow map and field ownership table',
        'Production integration with logging and alerts',
        'Runbook: what happens when an API is down',
        'Source code and credentials in your accounts',
      ],
    },
  },
  {
    slug: 'dashboards-bi',
    name: 'Dashboards & BI',
    tags: 'One panel, real-time',
    audience: 'For owners flying on monthly reports',
    promise: 'The numbers that decide things, in one place, without waiting for someone to assemble them.',
    outcome: 'One live panel for revenue, pipeline and operations, refreshed automatically.',
    icon: 'chart',
    fromPrice: 4200,
    items: [
      { label: 'Build', price: 'from $4,200' },
      { label: 'Additional data source', price: '$950' },
      { label: 'Hosting + upkeep', price: '$325/mo' },
    ],
    seo: {
      title: 'Business Dashboards & BI',
      description:
        'A live dashboard for the numbers that run your business, built from your existing tools. From $4,200, plus $950 per extra data source.',
    },
    body: {
      problem:
        'If the numbers that matter arrive once a month in a spreadsheet someone assembled, you’re deciding on last month’s business. And the person assembling it isn’t doing their real job.',
      approach: [
        { title: 'Define', text: 'We agree on the ten or so numbers that drive decisions, and exactly how each one is calculated.' },
        { title: 'Connect', text: 'We pull from the sources you already use: store, CRM, ads, analytics, accounting. Each additional source is $950.' },
        { title: 'Ship', text: 'A fast, access-controlled panel that loads on a phone, with definitions written next to every number.' },
      ],
      deliverables: [
        'Metric definitions document',
        'Live dashboard with role-based access',
        'Automated data refresh and failure alerts',
        'Hosting and upkeep for $325/mo, optional',
      ],
    },
  },
  {
    slug: 'technical-seo-aeo',
    name: 'Technical SEO & AEO',
    tags: 'Structure, speed, structured data',
    audience: 'For sites with content but no traction',
    promise: 'Machines can read your site properly. Search engines and answer engines both.',
    outcome: 'Clean crawl paths, fast pages and structured data that search engines and AI assistants can cite.',
    icon: 'search',
    fromPrice: 2350,
    items: [
      { label: 'Audit', price: '$2,400' },
      { label: 'Implementation', price: 'from $2,950' },
      { label: 'Answer-engine readiness', price: '$2,350' },
    ],
    seo: {
      title: 'Technical SEO & Answer Engine Optimization (AEO)',
      description:
        'Technical SEO audits ($2,400), implementation and answer-engine readiness ($2,350): structure, Core Web Vitals and structured data machines can read.',
    },
    body: {
      problem:
        'Good content doesn’t rank if crawlers can’t reach it, pages are slow, or the structure is ambiguous. Answer engines like ChatGPT, Perplexity and Google’s AI Overviews are stricter still: they quote sources they can parse with confidence.',
      approach: [
        { title: 'Audit', text: 'Crawlability, indexation, Core Web Vitals, internal linking, canonicals and structured data, ranked by impact.' },
        { title: 'Implement', text: 'We make the fixes in your codebase or CMS: templates, schema, redirects, performance budgets.' },
        { title: 'Answer-ready', text: 'Entity markup, FAQ and how-to structures, and source pages written so assistants can cite you accurately.' },
      ],
      deliverables: [
        'Prioritized technical audit',
        'Implemented fixes with before/after measurements',
        'Schema.org markup across key templates',
        'Answer-engine readiness checklist and pages',
      ],
    },
  },
  {
    slug: 'accessibility-compliance',
    name: 'Accessibility & Compliance',
    tags: 'ADA · WCAG 2.1 AA · CCPA/CPRA',
    audience: 'For sites carrying legal exposure',
    promise: 'Built into every project we ship. For existing sites: a defensible, documented conformance position, not a widget bolted onto the footer.',
    outcome: 'An audit you can hand to counsel, code that actually conforms, and monitoring that keeps it that way.',
    icon: 'shield',
    fromPrice: 1890,
    items: [
      { label: 'Audit — up to 12 templates', price: '$1,890' },
      { label: 'Each additional template', price: '$155' },
      { label: 'Remediation', price: 'from $3,700' },
      { label: 'VPAT / ACR document', price: '$1,260' },
      { label: 'Consent + privacy stack', price: '$1,475' },
      { label: 'Continuous monitoring', price: '$375/mo' },
    ],
    seo: {
      title: 'ADA & WCAG Accessibility Compliance for California Businesses',
      description:
        'WCAG 2.1 AA audits from $1,890, code-level remediation, VPAT/ACR documents and CCPA consent stacks. Senior engineers on Pacific time. No overlay widgets.',
    },
    body: {
      problem:
        'In California, an inaccessible website is legal exposure, not a design detail. Demand letters cite specific failures: missing labels, keyboard traps, low contrast, unlabeled images. Overlay widgets don’t fix the code underneath, and they don’t stop the letters.',
      approach: [
        { title: 'Audit', text: 'Manual and automated testing of up to 12 page templates against WCAG 2.1 AA, with screen readers and keyboard only. Every issue is mapped to a criterion, a severity and a fix.' },
        { title: 'Remediate', text: 'We fix the source: semantics, focus order, forms, contrast, media alternatives. Changes ship through your repo or CMS, reviewed like any other code.' },
        { title: 'Document', text: 'A VPAT / Accessibility Conformance Report and a public accessibility statement, so procurement, partners and counsel see a documented position.' },
        { title: 'Monitor', text: 'Scheduled scans and manual spot checks catch regressions from new content and releases before a plaintiff’s firm does.' },
      ],
      deliverables: [
        'Issue log mapped to WCAG success criteria, with severity and fix',
        'Remediated templates and components in your codebase',
        'VPAT 2.5 / ACR document',
        'Accessibility statement page',
        'Consent banner and privacy stack aligned with CCPA/CPRA',
        'Monthly monitoring report',
      ],
    },
  },
  {
    slug: 'infrastructure',
    name: 'Infrastructure',
    tags: 'Hosting · DNS · email deliverability',
    audience: 'For domains that stopped landing in inboxes',
    promise: 'Mail arrives, records are correct, and renewals don’t take the site down at 2 a.m.',
    outcome: 'Authenticated email, correct DNS, valid certificates and monitored uptime.',
    icon: 'server',
    fromPrice: 1150,
    items: [
      { label: 'Deliverability setup — SPF/DKIM/DMARC', price: '$1,150' },
      { label: 'Migration — hosting or mail', price: 'from $1,600' },
      { label: 'Managed infrastructure', price: '$275/mo' },
    ],
    seo: {
      title: 'Hosting, DNS & Email Deliverability (SPF, DKIM, DMARC)',
      description:
        'Email deliverability setup with SPF, DKIM and DMARC for $1,150, hosting and mail migrations from $1,600, managed infrastructure for $275/mo.',
    },
    body: {
      problem:
        'Invoices land in spam. A certificate expires on a Saturday. Nobody remembers who has the DNS login. Infrastructure problems are invisible until they cost you a customer.',
      approach: [
        { title: 'Inventory', text: 'Domains, DNS, hosting, certificates and mail providers documented in one place, with access in your name.' },
        { title: 'Authenticate', text: 'SPF, DKIM and DMARC configured and verified, with DMARC reporting so failures stop being invisible.' },
        { title: 'Operate', text: 'Migrations without downtime, HTTPS everywhere, security headers, and monitoring for uptime and certificate expiry.' },
      ],
      deliverables: [
        'Infrastructure inventory and access map',
        'SPF, DKIM and DMARC with reporting',
        'Zero-downtime migration plan and cutover',
        'Uptime, certificate and DNS monitoring',
      ],
    },
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);

/** "from $1,890", or "Fixed quote" for services quoted after the diagnosis. */
export const fromLabel = (s: Service) =>
  s.fromPrice === null ? 'Fixed quote' : `from $${s.fromPrice.toLocaleString('en-US')}`;
