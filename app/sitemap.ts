import type { MetadataRoute } from 'next';
import { TRADES, STATES, HRCW_CATEGORIES } from '@/lib/seo-data';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rapidswms.com.au';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/swms`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/swms/high-risk`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const tradePages: MetadataRoute.Sitemap = TRADES.map(trade => ({
    url: `${BASE_URL}/swms/${trade.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const tradeStatePages: MetadataRoute.Sitemap = TRADES.flatMap(trade =>
    STATES.map(state => ({
      url: `${BASE_URL}/swms/${trade.slug}/${state.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  );

  const hrcwPages: MetadataRoute.Sitemap = HRCW_CATEGORIES.map(cat => ({
    url: `${BASE_URL}/swms/high-risk/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...tradePages, ...tradeStatePages, ...hrcwPages];
}
