import type { Metadata } from 'next';
import { site } from '../config/site';

/** Per-page title, description, canonical and social cards. URLs resolve against the root layout's metadataBase. */
export function pageMeta({ title, description, path, og = 'home', noindex = false }: { title: string; description: string; path: string; og?: string; noindex?: boolean }): Metadata {
  const full = `${title} · ${site.name}`;
  const image = `/og/${og}.png`;
  return {
    title: full,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: 'website', siteName: site.name, title: full, description, url: path, locale: 'en_US', images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: full, description, images: [image] },
  };
}
