/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Fotos/arquivos servidos pelo Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
