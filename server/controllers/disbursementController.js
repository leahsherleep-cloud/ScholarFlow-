const Application = require('../models/Application');
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const Disbursement = require('../models/Disbursement');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog, createNotification } = require('../utils/helpers');

// @desc    Initiate disbursement
// @route   POST /api/disbursements
// @access  Private (Admin)
const initiateDisbursement = async (req, res, next) => {
  try {
    const { applicationId, transactionReference, remarks } = req.body;

    const application = await Application.findById(applicationId)
      .populate('student')
      .populate('scholarship');

    if (!application) return sendError(res, 'Application not found', 404);
    if (application.status !== 'APPROVED') {
      return sendError(res, 'Application must be approved before disbursement', 400);
    }

    // Check no duplicate disbursement
    const existing = await Disbursement.findOne({ applicationId });
    if (existing) return sendError(res, 'Disbursement already initiated for this application', 400);

    const disbursement = await Disbursement.create({
      applicationId,
      studentId: application.student._id,
      studentUserId: application.studentUser,
      scholarshipId: application.scholarship._id,
      amount: application.scholarship.amount,
      transactionReference,
      status: 'COMPLETED',
      bankDetails: application.student.bankDetails,
      disbursedAt: new Date(),
      processedBy: req.user._id,
      remarks,
    });

    // Update application status
    application.status = 'DISBURSED';
    application.disbursedAt = new Date();
    application.statusHistory.push({
      status: 'DISBURSED',
      changedBy: req.user._id,
      note: `Disbursement completed. Ref: ${transactionReference || 'N/A'}`,
    });
    await application.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'DISBURSEMENT_COMPLETED',
      entityType: 'disbursement',
      entityId: disbursement._id,
      newStatus: 'COMPLETED',
      remarks: `₹${application.scholarship.amount} disbursed for application ${application.applicationNumber}`,
      ipAddress: req.ip,
    });

    await createNotification(
      application.studentUser,
      '💰 Scholarship Disbursed!',
      `Your scholarship amount of ₹${application.scholarship.amount} has been disbursed successfully for application ${application.applicationNumber}.`,
      'DISBURSEMENT_COMPLETED',
      { entityType: 'disbursement', entityId: disbursement._id }
    );

    sendSuccess(res, 'Disbursement completed successfully', { disbursement }, 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get disbursements
// @route   GET /api/disbursements
// @access  Private (Admin)
const getDisbursements = async (req, res, next) => {
  try {
    const disbursements = await Disbursement.find()
      .populate('studentUserId', 'name email')
      .populate('scholarshipId', 'name amount')
      .populate('applicationId', 'applicationNumber')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, 'Disbursements retrieved', { disbursements });
  } catch (err) {
    next(err);
  }
};

// @desc    Update disbursement
// @route   PATCH /api/disbursements/:id
// @access  Private (Admin)
const updateDisbursement = async (req, res, next) => {
  try {
    const { transactionReference, remarks, status, bankDetails } = req.body;
    const updateData = {};
    if (transactionReference !== undefined) updateData.transactionReference = transactionReference;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (status !== undefined) updateData.status = status;
    if (bankDetails !== undefined) updateData.bankDetails = bankDetails;

    const disbursement = await Disbursement.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!disbursement) return sendError(res, 'Disbursement not found', 404);
    sendSuccess(res, 'Disbursement updated', { disbursement });
  } catch (err) {
    next(err);
  }
};

module.exports = { initiateDisbursement, getDisbursements, updateDisbursement };
