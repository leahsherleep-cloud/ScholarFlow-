import { Search } from 'lucide-react';

/**
 * SearchBar component
 * @param {string} value
 * @param {Function} onChange
 * @param {string} placeholder
 * @param {string} className
 */
const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative flex items-center ${className}`}>
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0 z-10" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="form-input form-input-with-icon pr-4"
      aria-label={placeholder}
    />
  </div>
);

export default SearchBar;
