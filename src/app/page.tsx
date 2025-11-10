'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="container mx-auto px-4 py-16">

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Hệ thống Bỏ phiếu
          </h1>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-12">
            Nền tảng bỏ phiếu phi tập trung được xây dựng trên Blockchain
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Bảo mật tuyệt đối</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mọi phiếu bầu được lưu trữ an toàn trên blockchain, không thể thay đổi
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Minh bạch</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kết quả công khai, có thể xác minh bất cứ lúc nào
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Nhanh chóng</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kết quả được cập nhật tức thì sau mỗi lượt bỏ phiếu
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Phi tập trung</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Không có trung gian, hoàn toàn tự động bằng Smart Contract
              </p>
            </div>

            <Link 
              href="/voting"
              className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex flex-col items-center justify-center text-center group"
            >
              <div className="text-lg font-semibold">
                Bắt đầu<br />Bỏ phiếu →
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
