const mongoose = require('mongoose');

const APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_VERIFICATION',
  'CORRECTION_REQUIRED',
  'RESUBMITTED',
  'VERIFIED',
  'UNDER_EVALUATION',
  'APPROVED',
  'REJECTED',
  'DISBURSED',
];

const ApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      unique: true,
      // Auto-generated before save
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scholarship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scholarship',
      required: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'DRAFT',
    },
    personalStatement: {
      type: String,
      trim: true,
    },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    disbursedAt: { type: Date },
    remarks: [
      {
        text: { type: String },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        role: { type: String },
      },
    ],
    correctionReason: {
      type: String,
      trim: true,
    },
    correctionRequestedAt: { type: Date },
    correctionRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes (applicationNumber is indexed via unique:true on the field)
ApplicationSchema.index({ student: 1 });
ApplicationSchema.index({ studentUser: 1 });
ApplicationSchema.index({ scholarship: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ createdAt: -1 });
ApplicationSchema.index({ assignedOfficer: 1 });
ApplicationSchema.index({ student: 1, scholarship: 1 }, { unique: true }); // One application per scholarship per student

// Generate unique application number before save
// Mongoose 9: async pre-hooks resolve via the returned Promise — do NOT use next()
ApplicationSchema.pre('save', async function () {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Application').countDocuments();
    const padded = String(count + 1).padStart(6, '0');
    this.applicationNumber = `SCH-${year}-${padded}`;
  }
  // return resolves the Promise — no next() needed
});


module.exports = mongoose.model('Application', ApplicationSchema);
