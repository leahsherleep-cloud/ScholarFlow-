const mongoose = require('mongoose');

const ScholarshipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scholarship name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Scholarship amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    eligibilityCriteria: {
      minimumCgpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
      },
      maximumFamilyIncome: {
        type: Number,
        default: 0,
      },
      eligibleCourses: {
        type: [String],
        default: [],
      },
      eligibleCategories: {
        type: [String],
        enum: ['general', 'obc', 'sc', 'st', 'ews', 'other', 'all'],
        default: ['all'],
      },
      eligibleYears: {
        type: [Number],
        default: [],
      },
      eligibleDepartments: {
        type: [String],
        default: [],
      },
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    applicationStartDate: {
      type: Date,
      required: [true, 'Application start date is required'],
    },
    applicationEndDate: {
      type: Date,
      required: [true, 'Application end date is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'inactive'],
      default: 'draft',
    },
    totalSlots: {
      type: Number,
      default: 0,
    },
    filledSlots: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ScholarshipSchema.index({ status: 1 });
ScholarshipSchema.index({ applicationEndDate: 1 });
ScholarshipSchema.index({ createdAt: -1 });
ScholarshipSchema.index({ 'eligibilityCriteria.eligibleCourses': 1 });

// Virtual: isOpen
ScholarshipSchema.virtual('isOpen').get(function () {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.applicationStartDate <= now &&
    this.applicationEndDate >= now
  );
});

ScholarshipSchema.set('toJSON', { virtuals: true });
ScholarshipSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Scholarship', ScholarshipSchema);
