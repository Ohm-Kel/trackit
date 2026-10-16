const express = require('express');
const chatController = require('../controllers/chatController');
const requireUser = require('../middleware/requireUser');
const { chatLimiter } = require('../middleware/rateLimit');

const router = express.Router();
router.use(requireUser);

router.post('/', chatLimiter, chatController.chat);
router.post('/stream', chatLimiter, chatController.chatStream);
router.get('/history', chatController.getHistory);
router.delete('/history', chatController.clearHistory);

module.exports = router;
