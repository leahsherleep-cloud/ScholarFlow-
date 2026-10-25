const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'APPLICATION_SUBMITTED',
        'VERIFICATION_STARTED',
        'CORRECTION_REQUESTED',
        'APPLICATION_RESUBMITTED',
        'DOCUMENT_VERIFIED',
        'DOCUMENT_REJECTED',
        'APPLICATION_VERIFIED',
        'APPLICATION_APPROVED',
        'APPLICATION_REJECTED',
        'DISBURSEMENT_COMPLETED',
        'SCHOLARSHIP_NEW',
        'GENERAL',
      ],
      default: 'GENERAL',
    },
    relatedEntity: {
      entityType: { type: String }, // 'application', 'scholarship', 'document'
      entityId: { type: mongoose.Schema.Types.ObjectId },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
