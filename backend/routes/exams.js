const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

const requireUser = require('../middleware/requireUser');

// GET /api/exams
router.get('/', requireUser, examController.getExams);

// GET /api/exams/:id
router.get('/:id', requireUser, examController.getExamById);

// POST /api/exams
router.post('/', requireUser, examController.createExam);

// PATCH /api/exams/:id
router.patch('/:id', requireUser, examController.updateExam);

// DELETE /api/exams/:id
router.delete('/:id', requireUser, examController.deleteExam);

module.exports = router;
