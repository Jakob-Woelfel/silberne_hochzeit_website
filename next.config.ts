import type { NextConfig } from "next";

// Thumbnails der Selfies laufen über next/image; der Storage-Host muss dafür
// freigegeben sein. Ohne Env (z. B. CI ohne Secrets) bleibt die Liste leer.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? [new URL("/storage/v1/object/public/selfies/**", supabaseUrl)]
      : [],
  },
};

export default nextConfig;
