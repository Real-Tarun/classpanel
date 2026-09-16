import { MetadataRoute } from 'next';

/**
 * Dynamic Robots.txt configuration for ClassPanel.online
 * Generates crawler directives compliant with Next.js MetadataRoute.Robots specification.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://classpanel.online';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/functions/', '/_redirects', '/_headers', '/.git/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      {
        userAgent: 'Applebot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
