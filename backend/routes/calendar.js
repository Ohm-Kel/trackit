const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const requireUser = require('../middleware/requireUser');

// Manage the subscription link (signed in).
router.get('/feed', requireUser, calendarController.getFeed);
router.post('/feed', requireUser, calendarController.createFeed);
router.delete('/feed', requireUser, calendarController.revokeFeed);

// GET /api/calendar/export.ics: one-off download (signed in). Registered
// before the feed route, which would otherwise treat "export" as a token.
router.get('/export.ics', requireUser, calendarController.exportCalendar);

// GET /api/calendar/:token.ics: subscription feed (the token is the credential).
router.get('/:token.ics', calendarController.getFeedCalendar);

module.exports = router;
