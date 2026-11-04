import type { MetadataRoute } from 'next';
import { services, site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', ...services.map((s) => `/services/${s.slug}/`)].map((path) => ({ url: `${site.url}${path}` }));
}
