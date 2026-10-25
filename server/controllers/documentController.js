const path = require('path');
const Document = require('../models/Document');
const Application = require('../models/Application');
const Student = require('../models/Student');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog, createNotification } = require('../utils/helpers');

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private (Student)
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please upload a file', 400);
    }

    const { applicationId, documentType, documentName } = req.body;

    if (!applicationId || !documentType || !documentName) {
      return sendError(res, 'applicationId, documentType and documentName are required', 400);
    }

    // Verify application belongs to student
    const application = await Application.findById(applicationId);
    if (!application) return sendError(res, 'Application not found', 404);

    if (application.studentUser.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized', 403);
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return sendError(res, 'Student profile not found', 404);

    // Check if same document type already exists — update it
    const existingDoc = await Document.findOne({ applicationId, documentType });

    const fileUrl = `/uploads/${req.file.filename}`;

    let document;
    if (existingDoc) {
      existingDoc.fileName = req.file.filename;
      existingDoc.originalName = req.file.originalname;
      existingDoc.fileUrl = fileUrl;
      existingDoc.fileSize = req.file.size;
      existingDoc.mimeType = req.file.mimetype;
      existingDoc.verificationStatus = 'PENDING';
      existingDoc.documentName = documentName;
      existingDoc.uploadedAt = new Date();
      existingDoc.verifiedBy = undefined;
      existingDoc.verifiedAt = undefined;
      existingDoc.rejectionReason = undefined;
      document = await existingDoc.save();
    } else {
      document = await Document.create({
        applicationId,
        studentId: student._id,
        studentUserId: req.user._id,
        documentType,
        documentName,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'document',
      entityId: document._id,
      remarks: `Document '${documentName}' uploaded`,
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Document uploaded successfully', { document }, 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get documents for an application
// @route   GET /api/documents/:applicationId
// @access  Private
const getDocuments = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return sendError(res, 'Application not found', 404);

    // Students can only view their own
    if (req.user.role === 'student') {
      if (application.studentUser.toString() !== req.user._id.toString()) {
        return sendError(res, 'Not authorized', 403);
      }
    }

    const documents = await Document.find({ applicationId: req.params.applicationId })
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Documents retrieved', { documents });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify document
// @route   PATCH /api/documents/:id/verify
// @access  Private (Officer/Admin)
const verifyDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return sendError(res, 'Document not found', 404);

    document.verificationStatus = 'VERIFIED';
    document.verifiedBy = req.user._id;
    document.verifiedAt = new Date();
    document.rejectionReason = undefined;
    await document.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'DOCUMENT_VERIFIED',
      entityType: 'document',
      entityId: document._id,
      previousStatus: 'PENDING',
      newStatus: 'VERIFIED',
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Document verified', { document });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject document
// @route   PATCH /api/documents/:id/reject
// @access  Private (Officer/Admin)
const rejectDocument = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return sendError(res, 'Rejection reason is required', 400);

    const document = await Document.findById(req.params.id);
    if (!document) return sendError(res, 'Document not found', 404);

    document.verificationStatus = 'REJECTED';
    document.verifiedBy = req.user._id;
    document.verifiedAt = new Date();
    document.rejectionReason = rejectionReason;
    await document.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'DOCUMENT_REJECTED',
      entityType: 'document',
      entityId: document._id,
      previousStatus: 'PENDING',
      newStatus: 'REJECTED',
      remarks: rejectionReason,
      ipAddress: req.ip,
    });

    await createNotification(
      document.studentUserId,
      'Document Rejected',
      `Your document '${document.documentName}' has been rejected. Reason: ${rejectionReason}`,
      'DOCUMENT_REJECTED',
      { entityType: 'document', entityId: document._id }
    );

    sendSuccess(res, 'Document rejected', { document });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadDocument, getDocuments, verifyDocument, rejectDocument };
