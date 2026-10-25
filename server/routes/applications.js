const express = require('express');
const router = express.Router();
const {
  createApplication,
  getApplications,
  getApplication,
  updateApplication,
  submitApplication,
  requestCorrection,
  verifyApplication,
  approveApplication,
  rejectApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student routes
router.post('/', authorize('student'), createApplication);
router.put('/:id', authorize('student'), updateApplication);
router.post('/:id/submit', authorize('student'), submitApplication);

// Officer + Admin routes
router.patch('/:id/request-correction', authorize('officer', 'admin'), requestCorrection);
router.patch('/:id/verify', authorize('officer', 'admin'), verifyApplication);
router.patch('/:id/approve', authorize('officer', 'admin'), approveApplication);
router.patch('/:id/reject', authorize('officer', 'admin'), rejectApplication);

// All authenticated users (role-filtered in controller)
router.get('/', getApplications);
router.get('/:id', getApplication);

module.exports = router;
