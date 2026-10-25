const express = require('express');
const router = express.Router();
const {
  getScholarships,
  getScholarship,
  createScholarship,
  updateScholarship,
  updateScholarshipStatus,
  deleteScholarship,
  checkScholarshipEligibility,
} = require('../controllers/scholarshipController');
const { protect, authorize } = require('../middleware/auth');

// Public/optional auth routes
router.get('/', (req, res, next) => {
  // Optional auth — allow public access but pass user if present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    return protect(req, res, () => next());
  }
  next();
}, getScholarships);

router.get('/:id', getScholarship);

// Protected routes
router.get('/:id/eligibility', protect, authorize('student'), checkScholarshipEligibility);

// Admin only
router.post('/', protect, authorize('admin'), createScholarship);
router.put('/:id', protect, authorize('admin'), updateScholarship);
router.patch('/:id/status', protect, authorize('admin'), updateScholarshipStatus);
router.delete('/:id', protect, authorize('admin'), deleteScholarship);

module.exports = router;
