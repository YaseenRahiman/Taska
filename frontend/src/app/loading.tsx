export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-primary-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-primary animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-xl bg-white opacity-50 animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Loading Taska
        </h2>
        <p className="text-gray-600">
          Please wait while we prepare your experience...
        </p>

        {/* Loading Animation - Spinner */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-3 w-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="h-3 w-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-primary animate-shimmer" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
