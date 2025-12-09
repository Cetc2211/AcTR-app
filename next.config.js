/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['@google/generative-ai', 'genkit', '@genkit-ai/google-genai'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', '*.app.github.dev'],
    },
  },
  // Configuración para evitar timeout en Vercel
  // Aumentar el timeout de generación de páginas estáticas
  staticPageGenerationTimeout: 120,
  
  // Excluir rutas específicas de la pre-renderización en build
  // Las rutas de API se ejecutan bajo demanda, no en tiempo de build
  onDemandRevalidation: true,
  
  // Configuración de headers para casos de timeout
  headers: async () => {
    return [
      {
        source: '/api/test-ai',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        source: '/api/generate-ia',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
