/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Fotos/arquivos servidos pelo Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Cabeçalhos de segurança (OWASP) — aplicados a todas as rotas.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" }, // anti-clickjacking
          { key: "X-Content-Type-Options", value: "nosniff" }, // anti MIME-sniffing
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // câmera liberada só para a própria origem (leitura de QR no check-in)
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
