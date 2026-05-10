export default function MacroRing({ label, consumed, target, unit = 'g', color, size = 110 }) {
  const pct    = target > 0 ? Math.min(consumed / target, 1) : 0;
  const r      = 38;
  const stroke = 9;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const over   = consumed > target;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* track */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {/* progress */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={over ? '#ef4444' : color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
        {/* consumed value */}
        <text x="50" y="46" textAnchor="middle" fill={over ? '#ef4444' : '#1f2937'} fontSize="14" fontWeight="700">
          {Math.round(consumed)}
        </text>
        {/* target */}
        <text x="50" y="60" textAnchor="middle" fill="#9ca3af" fontSize="10">
          /{target}{unit}
        </text>
      </svg>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}
