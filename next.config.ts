import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads go through Server Actions, and the default cap is 1 MB — under
      // it the request is rejected before our code runs and the browser only
      // sees "Failed to fetch". A post can carry 4 photos (5 MB each) plus a
      // song (10 MB), so this sits above that worst case with room to spare.
      // A production deployment should upload straight to the bucket instead.
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
