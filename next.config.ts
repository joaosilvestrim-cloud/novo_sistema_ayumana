import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions aceitam 1MB por padrão. Foto de perfil e galeria passam
      // fácil disso, então o salvamento do onboarding tomava erro. 4MB é o teto
      // seguro: a Vercel corta o corpo da requisição em ~4,5MB de qualquer jeito.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
