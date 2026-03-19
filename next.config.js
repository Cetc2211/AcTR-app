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
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', '*.app.github.dev'],
    },
  },
  // Configuración para evitar timeout en Vercel
  // Aumentar el timeout de generación de páginas estáticas a 180 segundos
  staticPageGenerationTimeout: 180,
  
  // Excluir rutas específicas de la pre-renderización en build
  // Las rutas de API se ejecutan bajo demanda, no en tiempo de build
  // onDemandRevalidation: true, // Esta opción no es estándar en next.config.js, se maneja por ruta
  
  // Configuración de headers para casos de timeout
  headers: async () => {
    return [
      {
        source: '/api/test-ai',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      },
      {
        source: '/api/generate-ia',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
