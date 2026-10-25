import { getStatusConfig } from '../../utils/helpers';

const StatusBadge = ({ status, size = 'sm' }) => {
  const config = getStatusConfig(status);

  const sizeClass = size === 'xs'
    ? 'text-xs px-2 py-0.5'
    : size === 'lg'
    ? 'text-sm px-3 py-1'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap flex-shrink-0 ${sizeClass} ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
