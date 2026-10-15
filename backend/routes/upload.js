const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimit');

const router = express.Router();
router.use(authMiddleware);

router.post('/parse', uploadLimiter, uploadController.parseUpload);
router.post('/import-exams', uploadController.importExams);
router.post('/save-schedule', uploadController.saveSchedule);

module.exports = router;
