const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// GET /api/exams
router.get('/', examController.getExams);

// GET /api/exams/:id
router.get('/:id', examController.getExamById);

// POST /api/exams
router.post('/', examController.createExam);

// PATCH /api/exams/:id
router.patch('/:id', examController.updateExam);

// DELETE /api/exams/:id
router.delete('/:id', examController.deleteExam);

module.exports = router;
