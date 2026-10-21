import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // İçe aktarım dosyası server action'la gelir (E-3 §(3): policy.import.azamiDosyaBoyutMb = 5).
    // Sınır, çok parçalı gövdenin ek baytları için biraz geniştir; boyut sert kısıtı action'dadır.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
