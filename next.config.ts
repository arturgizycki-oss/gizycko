import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads go through Server Actions, and the default cap is 1 MB — under
      // it the request is rejected before our code runs and the browser only
      // sees "Failed to fetch". A post can carry 4 photos (5 MB each), a song
      // (10 MB), and a video (30 MB), so this clears that worst case.
      // A production deployment should upload straight to the bucket instead.
      bodySizeLimit: "72mb",
    },
  },
};

export default nextConfig;
