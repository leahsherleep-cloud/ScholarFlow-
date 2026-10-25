const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  verifyDocument,
  rejectDocument,
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.post('/upload', authorize('student'), upload.single('document'), uploadDocument);
router.get('/:applicationId', getDocuments);
router.patch('/:id/verify', authorize('officer', 'admin'), verifyDocument);
router.patch('/:id/reject', authorize('officer', 'admin'), rejectDocument);

module.exports = router;
