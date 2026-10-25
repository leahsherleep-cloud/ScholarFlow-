import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total, limit } = pagination;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    if (range[0] > 1) {
      range.unshift('...');
      range.unshift(1);
    }
    if (range[range.length - 1] < pages) {
      range.push('...');
      range.push(pages);
    }
    return range;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{start}–{end}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
        </button>
        {getPageNumbers().map((num, i) =>
          num === '...' ? (
            <span key={i} className="px-2 text-slate-400 text-sm">...</span>
          ) : (
            <button
              key={i}
              onClick={() => onPageChange(num)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                num === page
                  ? 'bg-[#5B21B6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {num}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
