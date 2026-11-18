import type { WorkItem } from './types';

/**
 * Client projects confirmed by the owner (Nov 2026). Add measured results with their
 * source where available; a row without `result` shows scope only.
 */
export const work: WorkItem[] = [
  {
    name: 'ScanEat',
    industry: 'Restaurant tech',
    summary: 'QR ordering for restaurants: guests scan, join a shared table, order and pay together or separately, while orders reach a kitchen display.',
    scope: ['Product website', 'SEO content', 'Owner dashboard manual'],
    stack: ['Web app', 'KDS', 'Payments'],
  },
  {
    name: 'Central Toreo',
    url: 'https://centraltoreo.com',
    industry: 'Client site · hosting & operations',
    summary: 'Website hosting, DNS and mail on our infrastructure, with TLS 1.3 and monitored certificates.',
    scope: ['Hosting, DNS & mail', 'Monitoring'],
    stack: ['cPanel', 'TLS 1.3'],
  },
  {
    name: 'Excellentia Foods',
    url: 'https://excellentiafoods.com',
    industry: 'Food brand · US market',
    summary: 'US-facing food brand. Website, hosting and DNS on our infrastructure, with Google Workspace mail.',
    scope: ['Website', 'Hosting & DNS', 'Deliverability'],
    stack: ['cPanel', 'Google Workspace'],
  },
];
