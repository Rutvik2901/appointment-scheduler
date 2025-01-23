const express = require('express');

const appointmentController = require('../controllers/AppointmentController.js');

const router = express.Router();

router.get('/free-slots', (req, res) => appointmentController.getFreeSlots(req, res));
router.post('/create-event',(req, res) => appointmentController.createEvent(req, res));
router.get('/get-events', (req, res) => appointmentController.getEvents(req, res));

module.exports = router;