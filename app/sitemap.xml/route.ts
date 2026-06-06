import { TRADES, STATES, HRCW_CATEGORIES } from '@/lib/seo-data';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rapidswms.com.au';

function url(path: string, priority: string, changefreq: string): string {
  const loc = path === '' ? BASE_URL : `${BASE_URL}/${path}`;
  const today = new Date().toISOString().split('T')[0];
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

export async function GET(): Promise<Response> {
  const staticUrls = [
    url('', '1.0', 'weekly'),
    url('pricing', '0.8', 'monthly'),
    url('swms', '0.9', 'weekly'),
    url('swms/high-risk', '0.7', 'monthly'),
  ];

  const tradeUrls = TRADES.map(t => url(`swms/${t.slug}`, '0.8', 'monthly'));

  const tradeStateUrls = TRADES.flatMap(t =>
    STATES.map(s => url(`swms/${t.slug}/${s.slug}`, '0.7', 'monthly'))
  );

  const hrcwUrls = HRCW_CATEGORIES.map(c =>
    url(`swms/high-risk/${c.slug}`, '0.7', 'monthly')
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...tradeUrls,
    ...tradeStateUrls,
    ...hrcwUrls,
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
