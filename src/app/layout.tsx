import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { Metadata } from 'next';

import { Providers } from './providers';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'VoteChain - Hệ thống Bỏ phiếu Blockchain',
  description: 'Nền tảng bỏ phiếu phi tập trung an toàn và minh bạch',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
