import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account'],
    },
    sitemap: 'https://www.contrabxnd.io/sitemap.xml',
  };
}
