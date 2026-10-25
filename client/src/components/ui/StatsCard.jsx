const StatsCard = ({ icon: Icon, title, value, subtitle, trend, color = 'violet', loading }) => {
  const colorMap = {
    violet: { icon: 'bg-[#F5F3FF] text-[#5B21B6]', border: 'border-l-[#5B21B6]' },
    purple: { icon: 'bg-purple-50 text-purple-700', border: 'border-l-purple-600' },
    green:  { icon: 'bg-emerald-50 text-emerald-700', border: 'border-l-emerald-600' },
    blue:   { icon: 'bg-sky-50 text-sky-700', border: 'border-l-sky-600' },
    orange: { icon: 'bg-orange-50 text-orange-700', border: 'border-l-orange-500' },
    red:    { icon: 'bg-rose-50 text-rose-700', border: 'border-l-rose-500' },
    teal:   { icon: 'bg-teal-50 text-teal-700', border: 'border-l-teal-600' },
    indigo: { icon: 'bg-indigo-50 text-indigo-700', border: 'border-l-indigo-600' },
    yellow: { icon: 'bg-amber-50 text-amber-700', border: 'border-l-amber-500' },
    cyan:   { icon: 'bg-cyan-50 text-cyan-700', border: 'border-l-cyan-600' },
  };

  const c = colorMap[color] || colorMap.violet;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 card-shadow">
        <div className="skeleton h-10 w-10 rounded-lg mb-4" />
        <div className="skeleton h-7 w-16 mb-2" />
        <div className="skeleton h-4 w-28" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${c.border} p-5 card-shadow hover:shadow-md transition-all duration-200 fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${c.icon}`}>
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : (value ?? '—')}
      </p>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatsCard;
