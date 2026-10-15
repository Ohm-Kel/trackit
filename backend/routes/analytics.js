const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const requireUser = require('../middleware/requireUser');

router.use(requireUser);

router.get('/velocity', analyticsController.getStudyVelocity);
router.get('/burnout', analyticsController.getBurnoutAnalysis);

module.exports = router;
