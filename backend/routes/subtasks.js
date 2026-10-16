const express = require('express');
const router = express.Router();
const subtaskController = require('../controllers/subtaskController');
const requireUser = require('../middleware/requireUser');

router.get('/', requireUser, subtaskController.getSubtasks);
router.post('/', requireUser, subtaskController.createSubtask);
router.patch('/:id', requireUser, subtaskController.updateSubtask);
router.delete('/:id', requireUser, subtaskController.deleteSubtask);

module.exports = router;
