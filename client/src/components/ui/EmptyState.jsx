import { FileText } from 'lucide-react';

/**
 * EmptyState component
 * @param {React.ElementType} icon
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} action
 */
const EmptyState = ({ icon: Icon = FileText, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-4 border border-[#E5E7EB]">
      <Icon className="w-8 h-8 text-gray-300" />
    </div>
    <p className="font-semibold text-gray-700 text-base mb-1">{title}</p>
    {description && <p className="text-sm text-gray-400 max-w-sm leading-relaxed">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
