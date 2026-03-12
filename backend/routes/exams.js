const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

const authMiddleware = require('../middleware/authMiddleware');

// GET /api/exams
router.get('/', authMiddleware, examController.getExams);

// GET /api/exams/:id
router.get('/:id', authMiddleware, examController.getExamById);

// POST /api/exams
router.post('/', authMiddleware, examController.createExam);

// PATCH /api/exams/:id
router.patch('/:id', authMiddleware, examController.updateExam);

// DELETE /api/exams/:id
router.delete('/:id', authMiddleware, examController.deleteExam);

module.exports = router;
