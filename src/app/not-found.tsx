import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8">
        ページが見つかりませんでした
      </p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        ホームに戻る
      </Link>
    </div>
  );
}
