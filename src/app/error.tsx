'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-4xl font-bold mb-4">エラーが発生しました</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        予期しないエラーが発生しました。もう一度お試しください。
      </p>
      <p className="text-gray-600 text-sm mb-6 max-w-md break-all text-center">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        リトライ
      </button>
    </div>
  );
}
