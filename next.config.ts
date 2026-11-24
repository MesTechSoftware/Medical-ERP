import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // İçe aktarım dosyası server action'la gelir (E-3 §(3): policy.import.azamiDosyaBoyutMb = 5).
    // Sınır, çok parçalı gövdenin ek baytları için biraz geniştir; boyut sert kısıtı action'dadır.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Ü-39-1 (ÜG-1): temel güvenlik başlıkları. CSP bilinçli yoktur (Faz 2).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
};

export default nextConfig;
