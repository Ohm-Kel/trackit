const express = require('express');
const router = express.Router();
const subtaskController = require('../controllers/subtaskController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, subtaskController.getSubtasks);
router.post('/', authMiddleware, subtaskController.createSubtask);
router.patch('/:id', authMiddleware, subtaskController.updateSubtask);
router.delete('/:id', authMiddleware, subtaskController.deleteSubtask);

module.exports = router;
