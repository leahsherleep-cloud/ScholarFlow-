const User = require('../models/User');
const Student = require('../models/Student');
const Application = require('../models/Application');
const Scholarship = require('../models/Scholarship');
const AuditLog = require('../models/AuditLog');
const Disbursement = require('../models/Disbursement');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { createAuditLog, createNotification, getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalOfficers,
      totalScholarships,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      disbursedApplications,
      totalDisbursedAmount,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'officer', isActive: true }),
      Scholarship.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ['SUBMITTED', 'UNDER_VERIFICATION', 'RESUBMITTED'] } }),
      Application.countDocuments({ status: 'APPROVED' }),
      Application.countDocuments({ status: 'REJECTED' }),
      Application.countDocuments({ status: 'DISBURSED' }),
      Disbursement.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    // Applications by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const applicationsByMonth = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Applications by scholarship
    const applicationsByScholarship = await Application.aggregate([
      {
        $group: {
          _id: '$scholarship',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'scholarships',
          localField: '_id',
          foreignField: '_id',
          as: 'scholarship',
        },
      },
      { $unwind: '$scholarship' },
      {
        $project: {
          name: '$scholarship.name',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Status distribution
    const statusDistribution = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    sendSuccess(res, 'Dashboard stats retrieved', {
      stats: {
        totalStudents,
        totalOfficers,
        totalScholarships,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        disbursedApplications,
        totalDisbursedAmount: totalDisbursedAmount[0]?.total || 0,
      },
      charts: {
        applicationsByMonth,
        applicationsByScholarship,
        statusDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    sendPaginated(res, 'Users retrieved', users, pagination);
  } catch (err) {
    next(err);
  }
};

// @desc    Create officer account
// @route   POST /api/admin/users/officer
// @access  Private (Admin)
const createOfficer = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return sendError(res, 'Email already in use', 400);

    const officer = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'officer',
    });

    await createAuditLog({
      userId: req.user._id,
      action: 'OFFICER_CREATED',
      entityType: 'user',
      entityId: officer._id,
      remarks: `Officer account created for ${name}`,
      ipAddress: req.ip,
    });

    await createNotification(
      officer._id,
      'Account Created',
      `Welcome ${name}! Your officer account has been created by an administrator.`,
      'GENERAL'
    );

    sendSuccess(
      res,
      'Officer account created',
      {
        user: {
          id: officer._id,
          name: officer.name,
          email: officer.email,
          role: officer.role,
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (user.role === 'admin') {
      return sendError(res, 'Cannot deactivate admin accounts', 403);
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      userId: req.user._id,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: user._id,
      remarks: `User ${user.name} ${user.isActive ? 'activated' : 'deactivated'}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, {
      user: { id: user._id, name: user.name, isActive: user.isActive },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.action) filter.action = req.query.action;
    if (req.query.entityType) filter.entityType = req.query.entityType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    sendPaginated(res, 'Audit logs retrieved', logs, pagination);
  } catch (err) {
    next(err);
  }
};

// @desc    Get admin statistics for charts
// @route   GET /api/admin/statistics
// @access  Private (Admin)
const getStatistics = async (req, res, next) => {
  try {
    // Disbursement by month
    const disbursementByMonth = await Disbursement.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    sendSuccess(res, 'Statistics retrieved', { disbursementByMonth });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  createOfficer,
  toggleUserStatus,
  getAuditLogs,
  getStatistics,
};
