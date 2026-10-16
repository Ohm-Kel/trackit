const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const requireUser = require('../middleware/requireUser');

// All routes require authentication
router.use(requireUser);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.post('/generate-suggestions', notificationController.generateSuggestions);

module.exports = router;
