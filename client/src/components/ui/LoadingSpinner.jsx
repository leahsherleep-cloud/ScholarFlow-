import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
    <Loader2 className="w-8 h-8 animate-spin text-[#5B21B6]" />
    <p className="text-sm text-gray-500 font-medium">{text}</p>
  </div>
);

/** Full-screen page loader — shown while auth state initialises */
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#5B21B6]" />
      <p className="text-sm text-gray-500 font-medium">Loading ScholarFlow…</p>
    </div>
  </div>
);

export default LoadingSpinner;
