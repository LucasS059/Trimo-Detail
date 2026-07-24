import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trimodetail.com.br';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bloqueia os robôs de vasculharem áreas privadas e de processamento
      disallow: ['/api/', '/(admin)/'], 
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}