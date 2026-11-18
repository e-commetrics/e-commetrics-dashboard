import type { ReactNode } from 'react';
import SiteShell from '@/site/components/SiteShell';

// Marketing pages (ported from the Astro site). The home page lives on "/" behind the entry screen (src/components/landing.tsx).
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
