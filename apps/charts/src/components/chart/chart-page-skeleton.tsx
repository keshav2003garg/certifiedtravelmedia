export function ChartPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600 md:h-12 md:w-12" />
        <p className="mt-3 text-sm text-gray-600 md:mt-4 md:text-base">
          Loading...
        </p>
      </div>
    </div>
  );
}
