const Student = require('../models/Student');
const Application = require('../models/Application');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/helpers');

// Helper to safely get or initialize a student profile
const getOrCreateStudent = async (user) => {
  let student = await Student.findOne({ userId: user._id });
  if (!student) {
    const isDemoStudent = user.email === 'student@scholarflow.dev';
    student = await Student.create({
      userId: user._id,
      ...(isDemoStudent
        ? {
            registrationNumber: 'REG-2024-001234',
            dateOfBirth: new Date('2002-05-15'),
            gender: 'female',
            phone: '9876543210',
            address: {
              street: '24, Gandhi Nagar',
              city: 'Chennai',
              state: 'Tamil Nadu',
              pincode: '600020',
              country: 'India',
            },
            institution: 'Anna University',
            course: 'B.Tech',
            department: 'Computer Science and Engineering',
            year: 2,
            cgpa: 8.7,
            familyIncome: 250000,
            category: 'obc',
            bankDetails: {
              accountHolderName: 'Priya Sharma',
              accountNumber: '12345678901234',
              ifscCode: 'SBIN0001234',
              bankName: 'State Bank of India',
              branchName: 'Anna University Branch',
            },
            profileCompletionStatus: 95,
          }
        : {
            profileCompletionStatus: 0,
          }),
    });
  }
  return student;
};

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private (Student)
const getProfile = async (req, res, next) => {
  try {
    let student = await Student.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role createdAt'
    );

    if (!student) {
      await getOrCreateStudent(req.user);
      student = await Student.findOne({ userId: req.user._id }).populate(
        'userId',
        'name email role createdAt'
      );
    }

    sendSuccess(res, 'Profile retrieved successfully', { student });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private (Student)
const updateProfile = async (req, res, next) => {
  try {
    let student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      student = await getOrCreateStudent(req.user);
    }

    const allowedFields = [
      'registrationNumber',
      'dateOfBirth',
      'gender',
      'phone',
      'address',
      'institution',
      'course',
      'department',
      'year',
      'cgpa',
      'familyIncome',
      'category',
      'bankDetails',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    // Recalculate profile completion
    student.profileCompletionStatus = student.calculateProfileCompletion();

    await student.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'PROFILE_UPDATED',
      entityType: 'student',
      entityId: student._id,
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Profile updated successfully', { student });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student's applications
// @route   GET /api/students/applications
// @access  Private (Student)
const getMyApplications = async (req, res, next) => {
  try {
    let student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      student = await getOrCreateStudent(req.user);
    }

    const applications = await Application.find({ student: student._id })
      .populate('scholarship', 'name amount applicationEndDate status')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Applications retrieved', { applications });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getMyApplications, getOrCreateStudent };
