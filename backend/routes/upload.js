const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/upload/parse — parse a timetable file with AI
router.post('/parse', authMiddleware, uploadController.parseUpload);

// POST /api/upload/import-exams — bulk-create exams from parsed data
router.post('/import-exams', authMiddleware, uploadController.importExams);

// POST /api/upload/save-schedule — store weekly schedule on user profile
router.post('/save-schedule', authMiddleware, uploadController.saveSchedule);

module.exports = router;
