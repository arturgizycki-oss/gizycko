import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Photo uploads go through a Server Action, and the default cap is 1 MB —
      // below that limit the request is rejected before our code runs and the
      // browser only sees "Failed to fetch". Keep this above MAX_IMAGE_BYTES
      // (5 MB) so oversized files get a real error message instead.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
