export default function WaterWidget({ consumedMl, targetMl }) {
  const pct     = targetMl > 0 ? Math.min(consumedMl / targetMl, 1) : 0;
  const consumed = (consumedMl / 1000).toFixed(1);
  const target   = (targetMl  / 1000).toFixed(1);
  const pctInt   = Math.round(pct * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-2xl font-bold text-blue-600">{consumed}<span className="text-base font-medium text-gray-400"> L</span></p>
          <p className="text-sm text-gray-500">of {target} L daily goal</p>
        </div>
        <span className={`text-sm font-semibold ${pct >= 1 ? 'text-brand-600' : 'text-blue-500'}`}>
          {pctInt}%
        </span>
      </div>

      {/* progress bar styled as water level */}
      <div className="relative h-5 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {pct >= 1 && (
        <p className="text-xs text-brand-600 font-medium text-center">Daily water goal reached! 🎉</p>
      )}
    </div>
  );
}
