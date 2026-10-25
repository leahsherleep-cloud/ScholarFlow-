const express = require('express');
const router = express.Router();
const {
  initiateDisbursement,
  getDisbursements,
  updateDisbursement,
} = require('../controllers/disbursementController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.post('/', initiateDisbursement);
router.get('/', getDisbursements);
router.patch('/:id', updateDisbursement);

module.exports = router;
