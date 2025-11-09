import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">404</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 mb-6">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
