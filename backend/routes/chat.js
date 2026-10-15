const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimit');

const router = express.Router();
router.use(authMiddleware);

router.post('/', chatLimiter, chatController.chat);
router.get('/history', chatController.getHistory);
router.delete('/history', chatController.clearHistory);

module.exports = router;
