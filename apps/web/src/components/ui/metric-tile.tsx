interface MetricTileProps {
  label: string;
  value: string;
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-card">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}
