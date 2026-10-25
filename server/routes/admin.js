const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  createOfficer,
  toggleUserStatus,
  getAuditLogs,
  getStatistics,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.post('/users/officer', createOfficer);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/audit-logs', getAuditLogs);
router.get('/statistics', getStatistics);

module.exports = router;
