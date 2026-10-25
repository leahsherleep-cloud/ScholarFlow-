const Student = require('../models/Student');
const Application = require('../models/Application');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/helpers');

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private (Student)
const getProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role createdAt'
    );

    if (!student) {
      return sendError(res, 'Student profile not found', 404);
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
      return sendError(res, 'Student profile not found', 404);
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
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return sendError(res, 'Student profile not found', 404);

    const applications = await Application.find({ student: student._id })
      .populate('scholarship', 'name amount applicationEndDate status')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Applications retrieved', { applications });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getMyApplications };
