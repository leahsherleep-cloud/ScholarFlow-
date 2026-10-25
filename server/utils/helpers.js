const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

/**
 * Create a notification for a user
 */
const createNotification = async (userId, title, message, type, relatedEntity = null) => {
  try {
    const notifData = { userId, title, message, type };
    if (relatedEntity) {
      notifData.relatedEntity = relatedEntity;
    }
    await Notification.create(notifData);
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

/**
 * Create an audit log entry
 */
const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  previousStatus,
  newStatus,
  remarks,
  metadata,
  ipAddress,
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      previousStatus,
      newStatus,
      remarks,
      metadata,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};

/**
 * Parse pagination params from query
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination meta
 */
const buildPaginationMeta = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
};

module.exports = {
  createNotification,
  createAuditLog,
  getPaginationParams,
  buildPaginationMeta,
};
