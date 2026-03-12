const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

const authMiddleware = require('../middleware/authMiddleware');

// GET /api/tasks
router.get('/', authMiddleware, taskController.getTasks);

// GET /api/tasks/:id
router.get('/:id', authMiddleware, taskController.getTaskById);

// POST /api/tasks
router.post('/', authMiddleware, taskController.createTask);

// PATCH /api/tasks/:id
router.patch('/:id', authMiddleware, taskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, taskController.deleteTask);

module.exports = router;
