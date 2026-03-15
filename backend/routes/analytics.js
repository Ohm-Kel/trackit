const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/velocity', analyticsController.getStudyVelocity);
router.get('/burnout', analyticsController.getBurnoutAnalysis);

module.exports = router;
