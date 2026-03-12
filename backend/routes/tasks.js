const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// GET /api/tasks
router.get('/', taskController.getTasks);

// GET /api/tasks/:id
router.get('/:id', taskController.getTaskById);

// POST /api/tasks
router.post('/', taskController.createTask);

// PATCH /api/tasks/:id
router.patch('/:id', taskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
