const Application = require('../models/Application');
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const User = require('../models/User');
const Document = require('../models/Document');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const {
  createAuditLog,
  createNotification,
  getPaginationParams,
  buildPaginationMeta,
} = require('../utils/helpers');
const { checkEligibility } = require('../services/eligibilityService');

// @desc    Create application (start as draft)
// @route   POST /api/applications
// @access  Private (Student)
const createApplication = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || !student.course || student.cgpa === undefined || student.familyIncome === undefined) {
      return sendError(res, 'Please complete your student profile (academic info, CGPA, family income) before applying', 400);
    }

    const { scholarshipId, personalStatement } = req.body;

    // Check scholarship exists and is active
    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) return sendError(res, 'Scholarship not found', 404);
    if (scholarship.status !== 'active') return sendError(res, 'Scholarship is not active', 400);

    // Check if slots are full
    if (scholarship.totalSlots > 0 && scholarship.filledSlots >= scholarship.totalSlots) {
      return sendError(res, 'Scholarship application slots are full', 400);
    }

    // Check date
    const now = new Date();
    if (now < scholarship.applicationStartDate || now > scholarship.applicationEndDate) {
      return sendError(res, 'Scholarship application period is not open', 400);
    }

    // Check if already applied
    const existing = await Application.findOne({
      student: student._id,
      scholarship: scholarshipId,
    });
    if (existing) return sendError(res, 'You have already applied for this scholarship', 400);

    // Check eligibility
    const eligibility = await checkEligibility(student._id, scholarshipId);
    if (!eligibility.eligible) {
      return sendError(res, eligibility.reason || 'You do not meet the eligibility criteria for this scholarship', 400);
    }

    const application = await Application.create({
      student: student._id,
      studentUser: req.user._id,
      scholarship: scholarshipId,
      personalStatement,
      status: 'DRAFT',
      statusHistory: [{ status: 'DRAFT', changedBy: req.user._id, note: 'Application created' }],
    });

    await createAuditLog({
      userId: req.user._id,
      action: 'APPLICATION_CREATED',
      entityType: 'application',
      entityId: application._id,
      newStatus: 'DRAFT',
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Application created as draft', { application }, 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get applications (role-based)
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return sendError(res, 'Student profile not found', 404);
      filter.student = student._id;
    }

    // Filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.scholarship) filter.scholarship = req.query.scholarship;

    // Search by application number, student name/email, or scholarship name
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search.trim(), $options: 'i' };
      const [matchedUsers, matchedScholarships] = await Promise.all([
        User.find({
          $or: [{ name: searchRegex }, { email: searchRegex }],
        }).select('_id'),
        Scholarship.find({ name: searchRegex }).select('_id'),
      ]);

      const userIds = matchedUsers.map((u) => u._id);
      const scholarshipIds = matchedScholarships.map((s) => s._id);

      filter.$or = [
        { applicationNumber: searchRegex },
        { studentUser: { $in: userIds } },
        { scholarship: { $in: scholarshipIds } },
      ];
    }

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('student', 'registrationNumber institution course year cgpa')
        .populate('studentUser', 'name email')
        .populate('scholarship', 'name amount applicationEndDate')
        .populate('assignedOfficer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    sendPaginated(res, 'Applications retrieved', applications, pagination);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student')
      .populate('studentUser', 'name email')
      .populate('scholarship')
      .populate('assignedOfficer', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('correctionRequestedBy', 'name email')
      .populate('statusHistory.changedBy', 'name role');

    if (!application) return sendError(res, 'Application not found', 404);

    // Students can only view their own applications
    if (req.user.role === 'student') {
      if (application.studentUser._id.toString() !== req.user._id.toString()) {
        return sendError(res, 'Not authorized to view this application', 403);
      }
    }

    sendSuccess(res, 'Application retrieved', { application });
  } catch (err) {
    next(err);
  }
};

// @desc    Update application (draft only)
// @route   PUT /api/applications/:id
// @access  Private (Student)
const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return sendError(res, 'Application not found', 404);

    if (application.studentUser.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized', 403);
    }

    const editableStatuses = ['DRAFT', 'CORRECTION_REQUIRED'];
    if (!editableStatuses.includes(application.status)) {
      return sendError(res, 'Application cannot be edited in its current status', 400);
    }

    if (req.body.personalStatement !== undefined) {
      application.personalStatement = req.body.personalStatement;
    }

    await application.save();
    sendSuccess(res, 'Application updated', { application });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit application
// @route   POST /api/applications/:id/submit
// @access  Private (Student)
const submitApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('scholarship');
    if (!application) return sendError(res, 'Application not found', 404);

    if (application.studentUser.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized', 403);
    }

    const submittableStatuses = ['DRAFT', 'CORRECTION_REQUIRED'];
    if (!submittableStatuses.includes(application.status)) {
      return sendError(res, 'Application is already submitted', 400);
    }

    // Check if slots are full before submitting
    if (
      application.scholarship?.totalSlots > 0 &&
      application.scholarship?.filledSlots >= application.scholarship?.totalSlots
    ) {
      return sendError(res, 'Scholarship application slots are full', 400);
    }

    // Check required documents
    const requiredDocs = application.scholarship?.requiredDocuments || [];
    if (requiredDocs.length > 0) {
      const uploadedDocs = await Document.find({
        applicationId: application._id,
        verificationStatus: { $ne: 'REJECTED' },
      });
      const uploadedTypes = new Set(uploadedDocs.map((d) => d.documentType));
      const missingDocs = requiredDocs.filter((type) => !uploadedTypes.has(type));

      if (missingDocs.length > 0) {
        return sendError(
          res,
          `Please upload all required documents before submitting. Missing: ${missingDocs.join(', ')}`,
          400
        );
      }
    }

    const previousStatus = application.status;
    const newStatus = previousStatus === 'CORRECTION_REQUIRED' ? 'RESUBMITTED' : 'SUBMITTED';

    application.status = newStatus;
    application.submittedAt = new Date();
    application.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id,
      note: newStatus === 'RESUBMITTED' ? 'Application resubmitted after correction' : 'Application submitted',
    });

    await application.save();

    // Update scholarship's filled slots
    if (newStatus === 'SUBMITTED') {
      await Scholarship.findByIdAndUpdate(application.scholarship._id, {
        $inc: { filledSlots: 1 },
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: newStatus === 'RESUBMITTED' ? 'APPLICATION_RESUBMITTED' : 'APPLICATION_SUBMITTED',
      entityType: 'application',
      entityId: application._id,
      previousStatus,
      newStatus,
      ipAddress: req.ip,
    });

    // Notify student
    await createNotification(
      req.user._id,
      'Application Submitted',
      `Your application ${application.applicationNumber} has been submitted successfully and is under review.`,
      'APPLICATION_SUBMITTED',
      { entityType: 'application', entityId: application._id }
    );

    sendSuccess(res, 'Application submitted successfully', { application });
  } catch (err) {
    next(err);
  }
};

// @desc    Request correction
// @route   PATCH /api/applications/:id/request-correction
// @access  Private (Officer)
const requestCorrection = async (req, res, next) => {
  try {
    const { correctionReason } = req.body;
    if (!correctionReason) return sendError(res, 'Correction reason is required', 400);

    const application = await Application.findById(req.params.id);
    if (!application) return sendError(res, 'Application not found', 404);

    if (!['UNDER_VERIFICATION', 'SUBMITTED', 'RESUBMITTED'].includes(application.status)) {
      return sendError(res, 'Cannot request correction in current status', 400);
    }

    const previousStatus = application.status;
    application.status = 'CORRECTION_REQUIRED';
    application.correctionReason = correctionReason;
    application.correctionRequestedAt = new Date();
    application.correctionRequestedBy = req.user._id;
    application.statusHistory.push({
      status: 'CORRECTION_REQUIRED',
      changedBy: req.user._id,
      note: correctionReason,
    });

    await application.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'CORRECTION_REQUESTED',
      entityType: 'application',
      entityId: application._id,
      previousStatus,
      newStatus: 'CORRECTION_REQUIRED',
      remarks: correctionReason,
      ipAddress: req.ip,
    });

    await createNotification(
      application.studentUser,
      'Correction Required',
      `Your application ${application.applicationNumber} requires correction: ${correctionReason}`,
      'CORRECTION_REQUESTED',
      { entityType: 'application', entityId: application._id }
    );

    sendSuccess(res, 'Correction requested', { application });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify application
// @route   PATCH /api/applications/:id/verify
// @access  Private (Officer)
const verifyApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return sendError(res, 'Application not found', 404);

    const verifiableStatuses = ['SUBMITTED', 'RESUBMITTED', 'UNDER_VERIFICATION'];
    if (!verifiableStatuses.includes(application.status)) {
      return sendError(res, 'Application cannot be verified in its current status', 400);
    }

    const previousStatus = application.status;
    application.status = 'VERIFIED';
    application.verifiedAt = new Date();
    application.assignedOfficer = req.user._id;
    application.statusHistory.push({
      status: 'VERIFIED',
      changedBy: req.user._id,
      note: req.body.remarks || 'Application verified by officer',
    });

    if (req.body.remarks) {
      application.remarks.push({
        text: req.body.remarks,
        addedBy: req.user._id,
        role: req.user.role,
      });
    }

    await application.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'APPLICATION_VERIFIED',
      entityType: 'application',
      entityId: application._id,
      previousStatus,
      newStatus: 'VERIFIED',
      ipAddress: req.ip,
    });

    await createNotification(
      application.studentUser,
      'Application Verified',
      `Your application ${application.applicationNumber} has been verified and is under evaluation.`,
      'APPLICATION_VERIFIED',
      { entityType: 'application', entityId: application._id }
    );

    sendSuccess(res, 'Application verified', { application });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve application
// @route   PATCH /api/applications/:id/approve
// @access  Private (Officer/Admin)
const approveApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return sendError(res, 'Application not found', 404);

    if (!['VERIFIED', 'UNDER_EVALUATION'].includes(application.status)) {
      return sendError(res, 'Application cannot be approved in its current status', 400);
    }

    const previousStatus = application.status;
    application.status = 'APPROVED';
    application.approvedAt = new Date();
    application.approvedBy = req.user._id;
    application.statusHistory.push({
      status: 'APPROVED',
      changedBy: req.user._id,
      note: req.body.remarks || 'Application approved',
    });

    if (req.body.remarks) {
      application.remarks.push({
        text: req.body.remarks,
        addedBy: req.user._id,
        role: req.user.role,
      });
    }

    await application.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'APPLICATION_APPROVED',
      entityType: 'application',
      entityId: application._id,
      previousStatus,
      newStatus: 'APPROVED',
      ipAddress: req.ip,
    });

    await createNotification(
      application.studentUser,
      '🎉 Application Approved!',
      `Congratulations! Your application ${application.applicationNumber} has been approved. Scholarship disbursement will be processed shortly.`,
      'APPLICATION_APPROVED',
      { entityType: 'application', entityId: application._id }
    );

    sendSuccess(res, 'Application approved', { application });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject application
// @route   PATCH /api/applications/:id/reject
// @access  Private (Officer/Admin)
const rejectApplication = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return sendError(res, 'Rejection reason is required', 400);

    const application = await Application.findById(req.params.id);
    if (!application) return sendError(res, 'Application not found', 404);

    if (['APPROVED', 'REJECTED', 'DISBURSED'].includes(application.status)) {
      return sendError(res, 'Application cannot be rejected in its current status', 400);
    }

    const previousStatus = application.status;
    application.status = 'REJECTED';
    application.rejectedAt = new Date();
    application.rejectedBy = req.user._id;
    application.rejectionReason = rejectionReason;
    application.statusHistory.push({
      status: 'REJECTED',
      changedBy: req.user._id,
      note: rejectionReason,
    });

    await application.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'APPLICATION_REJECTED',
      entityType: 'application',
      entityId: application._id,
      previousStatus,
      newStatus: 'REJECTED',
      remarks: rejectionReason,
      ipAddress: req.ip,
    });

    await createNotification(
      application.studentUser,
      'Application Rejected',
      `Your application ${application.applicationNumber} has been rejected. Reason: ${rejectionReason}`,
      'APPLICATION_REJECTED',
      { entityType: 'application', entityId: application._id }
    );

    sendSuccess(res, 'Application rejected', { application });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplication,
  updateApplication,
  submitApplication,
  requestCorrection,
  verifyApplication,
  approveApplication,
  rejectApplication,
};
