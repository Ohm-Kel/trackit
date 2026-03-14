const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/chat
router.post('/', authMiddleware, chatController.chat);

// GET /api/chat/history — load persisted chat history
router.get('/history', authMiddleware, chatController.getHistory);

// DELETE /api/chat/history — clear chat history
router.delete('/history', authMiddleware, chatController.clearHistory);

module.exports = router;
