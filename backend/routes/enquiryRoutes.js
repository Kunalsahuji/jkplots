const express = require('express');
const router = express.Router();

const {
    createEnquiry,
    getEnquiries,
    updateEnquiryStatus
} = require('../controllers/enquiryController');

const { protect } = require('../middleware/auth');

router.use(protect); // All enquiry actions require login

router.post('/', createEnquiry);
router.get('/', getEnquiries);
router.put('/:id', updateEnquiryStatus);

module.exports = router;
