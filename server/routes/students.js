const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getMyApplications } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('student'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/applications', getMyApplications);

module.exports = router;
