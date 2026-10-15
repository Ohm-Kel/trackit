const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireUser = require('../middleware/requireUser');

router.get('/profile', requireUser, userController.getProfile);
router.patch('/profile', requireUser, userController.updateProfile);

module.exports = router;
