const express = require('express');
const uploadController = require('../controllers/uploadController');
const requireUser = require('../middleware/requireUser');
const { uploadLimiter } = require('../middleware/rateLimit');

const router = express.Router();
router.use(requireUser);

router.post('/parse', uploadLimiter, uploadController.parseUpload);
router.post('/import-exams', uploadController.importExams);
router.post('/save-schedule', uploadController.saveSchedule);

module.exports = router;
