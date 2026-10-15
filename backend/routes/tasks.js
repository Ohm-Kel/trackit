const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

const requireUser = require('../middleware/requireUser');

// GET /api/tasks
router.get('/', requireUser, taskController.getTasks);

// GET /api/tasks/:id
router.get('/:id', requireUser, taskController.getTaskById);

// POST /api/tasks
router.post('/', requireUser, taskController.createTask);

// PATCH /api/tasks/:id
router.patch('/:id', requireUser, taskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', requireUser, taskController.deleteTask);

module.exports = router;
