import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false, // Desativa o indicador de ISR estático
    buildActivity: false, // Desativa o indicador flutuante de compilação/Rendering no navegador
  },
};

export default nextConfig;
