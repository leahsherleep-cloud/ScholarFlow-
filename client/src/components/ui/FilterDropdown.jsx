import { Filter } from 'lucide-react';

/**
 * FilterDropdown component
 * @param {Array} options - [{value, label}]
 * @param {string} value
 * @param {Function} onChange
 * @param {string} label
 * @param {string} className
 */
const FilterDropdown = ({ options = [], value, onChange, label = 'Filter', className = '' }) => (
  <div className={`relative flex items-center ${className}`}>
    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0 z-10" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-input form-select-with-icon appearance-none w-full cursor-pointer bg-white text-slate-800 text-sm"
      aria-label={label}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <svg
      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0 z-10"
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

export default FilterDropdown;
