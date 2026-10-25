const Scholarship = require('../models/Scholarship');
const Student = require('../models/Student');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { createAuditLog, getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { checkEligibility } = require('../services/eligibilityService');

// @desc    Get all scholarships
// @route   GET /api/scholarships
// @access  Public
const getScholarships = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // For public/student view, only show active
    if (!req.user || req.user.role === 'student') {
      filter.status = 'active';
    }

    const [scholarships, total] = await Promise.all([
      Scholarship.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Scholarship.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    sendPaginated(res, 'Scholarships retrieved', scholarships, pagination);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single scholarship
// @route   GET /api/scholarships/:id
// @access  Public
const getScholarship = async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!scholarship) {
      return sendError(res, 'Scholarship not found', 404);
    }

    sendSuccess(res, 'Scholarship retrieved', { scholarship });
  } catch (err) {
    next(err);
  }
};

// @desc    Create scholarship
// @route   POST /api/scholarships
// @access  Private (Admin)
const createScholarship = async (req, res, next) => {
  try {
    const scholarship = await Scholarship.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await createAuditLog({
      userId: req.user._id,
      action: 'SCHOLARSHIP_CREATED',
      entityType: 'scholarship',
      entityId: scholarship._id,
      newStatus: scholarship.status,
      remarks: `Scholarship '${scholarship.name}' created`,
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Scholarship created successfully', { scholarship }, 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Update scholarship
// @route   PUT /api/scholarships/:id
// @access  Private (Admin)
const updateScholarship = async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
      return sendError(res, 'Scholarship not found', 404);
    }

    const updatedScholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    await createAuditLog({
      userId: req.user._id,
      action: 'SCHOLARSHIP_UPDATED',
      entityType: 'scholarship',
      entityId: scholarship._id,
      remarks: `Scholarship '${scholarship.name}' updated`,
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Scholarship updated successfully', { scholarship: updatedScholarship });
  } catch (err) {
    next(err);
  }
};

// @desc    Update scholarship status
// @route   PATCH /api/scholarships/:id/status
// @access  Private (Admin)
const updateScholarshipStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'active', 'closed', 'inactive'];

    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return sendError(res, 'Scholarship not found', 404);
    }

    const previousStatus = scholarship.status;
    scholarship.status = status;
    scholarship.lastUpdatedBy = req.user._id;
    await scholarship.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'SCHOLARSHIP_STATUS_CHANGED',
      entityType: 'scholarship',
      entityId: scholarship._id,
      previousStatus,
      newStatus: status,
      remarks: `Status changed from ${previousStatus} to ${status}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, `Scholarship status updated to ${status}`, { scholarship });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete scholarship
// @route   DELETE /api/scholarships/:id
// @access  Private (Admin)
const deleteScholarship = async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return sendError(res, 'Scholarship not found', 404);
    }

    const applicationCount = await Application.countDocuments({ scholarship: scholarship._id });
    if (applicationCount > 0) {
      return sendError(
        res,
        `Cannot delete scholarship with ${applicationCount} existing application(s). You can change its status to 'closed' or 'inactive' instead.`,
        400
      );
    }

    await scholarship.deleteOne();

    await createAuditLog({
      userId: req.user._id,
      action: 'SCHOLARSHIP_DELETED',
      entityType: 'scholarship',
      entityId: scholarship._id,
      remarks: `Scholarship '${scholarship.name}' deleted`,
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Scholarship deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Check eligibility for a scholarship
// @route   GET /api/scholarships/:id/eligibility
// @access  Private (Student)
const checkScholarshipEligibility = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return sendError(res, 'Student profile not found. Please complete your profile.', 404);
    }

    const result = await checkEligibility(student._id, req.params.id);
    sendSuccess(res, 'Eligibility check completed', result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getScholarships,
  getScholarship,
  createScholarship,
  updateScholarship,
  updateScholarshipStatus,
  deleteScholarship,
  checkScholarshipEligibility,
};
