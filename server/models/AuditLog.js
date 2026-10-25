const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'STUDENT_REGISTERED',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_DEACTIVATED',
        'USER_ACTIVATED',
        'PROFILE_UPDATED',
        'APPLICATION_CREATED',
        'APPLICATION_SUBMITTED',
        'APPLICATION_RESUBMITTED',
        'APPLICATION_VERIFIED',
        'APPLICATION_APPROVED',
        'APPLICATION_REJECTED',
        'CORRECTION_REQUESTED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_VERIFIED',
        'DOCUMENT_REJECTED',
        'DISBURSEMENT_INITIATED',
        'DISBURSEMENT_COMPLETED',
        'DISBURSEMENT_FAILED',
        'SCHOLARSHIP_CREATED',
        'SCHOLARSHIP_UPDATED',
        'SCHOLARSHIP_STATUS_CHANGED',
        'SCHOLARSHIP_DELETED',
        'OFFICER_CREATED',
        'REMARKS_ADDED',
      ],
    },
    entityType: {
      type: String,
      enum: ['user', 'student', 'scholarship', 'application', 'document', 'disbursement'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    previousStatus: {
      type: String,
    },
    newStatus: {
      type: String,
    },
    remarks: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
