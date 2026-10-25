const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    institution: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 7,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    familyIncome: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      enum: ['general', 'obc', 'sc', 'st', 'ews', 'other'],
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
      branchName: { type: String, trim: true },
    },
    profileCompletionStatus: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    profilePhoto: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (userId and registrationNumber are indexed via unique:true on the field)
StudentSchema.index({ course: 1 });
StudentSchema.index({ department: 1 });
StudentSchema.index({ category: 1 });

// Calculate profile completion
StudentSchema.methods.calculateProfileCompletion = function () {
  const fields = [
    'registrationNumber',
    'dateOfBirth',
    'gender',
    'phone',
    'institution',
    'course',
    'department',
    'year',
    'cgpa',
    'familyIncome',
    'category',
  ];

  const addressFields = ['street', 'city', 'state', 'pincode'];
  const bankFields = ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName'];

  let completed = 0;
  const total = fields.length + 2; // +2 for address group and bank group

  fields.forEach((field) => {
    if (this[field] !== undefined && this[field] !== null && this[field] !== '') {
      completed++;
    }
  });

  const addressComplete = addressFields.every(
    (f) => this.address && this.address[f] && this.address[f].trim() !== ''
  );
  if (addressComplete) completed++;

  const bankComplete = bankFields.every(
    (f) => this.bankDetails && this.bankDetails[f] && this.bankDetails[f].trim() !== ''
  );
  if (bankComplete) completed++;

  return Math.round((completed / total) * 100);
};

module.exports = mongoose.model('Student', StudentSchema);
