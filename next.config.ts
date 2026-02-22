const nextConfig = {
  /* config options here */
  
  // Configure for spawn() compatibility
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Ensure Node.js modules are available on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('child_process');
    }
    return config;
  },
  
  // 静的ファイルのキャッシュ制御
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
