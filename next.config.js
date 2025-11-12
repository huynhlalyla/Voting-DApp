/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Fix cũ cho React Native (chúng ta vẫn giữ lại)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },

  // === PHẦN MỚI ĐỂ SỬA LỖI CSP ===
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Giá trị CSP mới cho phép 'unsafe-eval' cho Web3/Blockchain
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss: ws:",
              "frame-src 'self' https:",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // === KẾT THÚC PHẦN MỚI ===
};

module.exports = nextConfig;