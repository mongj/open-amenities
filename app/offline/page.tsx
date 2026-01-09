'use client'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 text-6xl">📡</div>
      <h1 className="mb-2 text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-gray-600">
        Please check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  )
}
