/**
 * Format currency in Indian Rupee
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status badge config
 */
export const getStatusConfig = (status) => {
  const configs = {
    // Application statuses
    DRAFT:              { label: 'Draft',              className: 'status-draft',               color: 'gray'    },
    SUBMITTED:          { label: 'Submitted',          className: 'status-submitted',           color: 'blue'    },
    UNDER_VERIFICATION: { label: 'Under Verification', className: 'status-under-verification',  color: 'yellow'  },
    CORRECTION_REQUIRED:{ label: 'Correction Required',className: 'status-correction-required', color: 'orange'  },
    RESUBMITTED:        { label: 'Resubmitted',        className: 'status-resubmitted',         color: 'cyan'    },
    VERIFIED:           { label: 'Verified',           className: 'status-verified',            color: 'teal'    },
    UNDER_EVALUATION:   { label: 'Under Evaluation',   className: 'status-under-evaluation',    color: 'purple'  },
    APPROVED:           { label: 'Approved',           className: 'status-approved',            color: 'green'   },
    REJECTED:           { label: 'Rejected',           className: 'status-rejected',            color: 'red'     },
    DISBURSED:          { label: 'Disbursed',          className: 'status-disbursed',           color: 'emerald' },
    // Document-specific statuses (use distinct keys from context)
    PENDING:            { label: 'Pending',            className: 'status-submitted',           color: 'yellow'  },
    // Scholarship listing statuses
    active:             { label: 'Active',             className: 'status-approved',            color: 'green'   },
    draft:              { label: 'Draft',              className: 'status-draft',               color: 'gray'    },
    closed:             { label: 'Closed',             className: 'status-rejected',            color: 'red'     },
    inactive:           { label: 'Inactive',           className: 'status-draft',              color: 'gray'    },
  };
  return configs[status] || { label: status || '—', className: 'status-draft', color: 'gray' };
};

/**
 * Get document type label
 */
export const getDocumentTypeLabel = (type) => {
  const labels = {
    identity_proof: 'Identity Proof',
    income_certificate: 'Income Certificate',
    mark_sheet: 'Mark Sheet / Transcript',
    college_id: 'College ID',
    community_certificate: 'Community Certificate',
    bonafide_certificate: 'Bonafide Certificate',
    bank_proof: 'Bank Account Proof',
    scholarship_specific: 'Scholarship-Specific Document',
    other: 'Other Document',
  };
  return labels[type] || type;
};

/**
 * Truncate text
 */
export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Month name from number
 */
export const getMonthName = (month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || month;
};
