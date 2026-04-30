interface ChartNotesProps {
  generalNotes: string | null;
}

export function ChartNotes({ generalNotes }: ChartNotesProps) {
  if (!generalNotes) return null;

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mt-6">
      <p className="mb-1 text-xs font-semibold tracking-wide text-amber-700 uppercase sm:text-sm">
        Notes
      </p>
      <p className="text-sm whitespace-pre-wrap text-amber-900 sm:text-base">
        {generalNotes}
      </p>
    </div>
  );
}
