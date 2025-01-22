const express = require('express');

const appointmentController = require('../controllers/AppointmentController.js');

const router = express.Router();

router.get('/free-slots', appointmentController.getFreeSlots());
router.post('/create-event', appointmentController.createEvent());
router.get('/get-events', appointmentController.getEvents());

module.exports = router;