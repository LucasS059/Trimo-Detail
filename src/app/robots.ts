import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://trimo-detail.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bloqueia os robôs de vasculharem áreas privadas e rotas de API
      disallow: ['/api/', '/agenda', '/clientes', '/servicos', '/financeiro', '/configuracoes'], 
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}