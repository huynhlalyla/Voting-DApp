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
            // Giá trị CSP mới cho phép 'unsafe-eval'
            value: "default-src 'self'; " +
                   "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
                   "style-src 'self' 'unsafe-inline'; " +
                   "img-src 'self' data: *; " + // Cho phép ảnh từ mọi nguồn
                   "font-src 'self'; " +
                   "connect-src *; " + // Cho phép kết nối tới mọi RPC
                   "frame-src *;",     // Cho phép pop-up của ví
          },
        ],
      },
    ];
  },
  // === KẾT THÚC PHẦN MỚI ===
};

module.exports = nextConfig;