import { X, AlertTriangle } from 'lucide-react';

/**
 * ConfirmationDialog — a modal dialog for confirm/cancel actions
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onConfirm
 * @param {string} title
 * @param {string} message
 * @param {string} confirmLabel
 * @param {string} variant - 'danger' | 'primary'
 * @param {boolean} loading
 */
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#E5E7EB] p-6 w-full max-w-sm shadow-xl fade-in">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${variant === 'danger' ? 'bg-red-50' : 'bg-purple-50'}`}>
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-500' : 'text-[#5B21B6]'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#172033] text-base mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
