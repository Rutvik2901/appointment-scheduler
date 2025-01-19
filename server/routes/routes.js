const express = require('express');

const {getFreeSlots, createEvent, getEvents} = require("../controllers/schedulerController.js"); 

const router = express.Router();

router.get('/free-slots', getFreeSlots);
router.post('/create-event', createEvent);
router.get('/get-events', getEvents);

module.exports = router;