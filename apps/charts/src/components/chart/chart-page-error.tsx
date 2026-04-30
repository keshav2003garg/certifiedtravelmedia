interface ChartPageErrorProps {
  error?: Error;
}

export function ChartPageError({ error }: ChartPageErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center text-red-600">
        <p className="text-lg font-semibold md:text-xl">Error loading chart</p>
        <p className="mt-1 text-sm md:mt-2">
          {error?.message || 'Location not found'}
        </p>
      </div>
    </div>
  );
}
