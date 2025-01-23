const appointmentService = require('../services/AppointmentService');

class AppointmentController {
  async getFreeSlots(req, res) {
    try {
      const { date, timezone = config.defaultTimeZone } = req.query;
      const slots = await appointmentService.getFreeSlots(date, timezone);
      res.status(200).send(slots);
    } catch (error) {
      res.status(400).send(JSON.parse(error.message));
    }
  }

  async createEvent(req, res) {
    try {
      const { datetime, duration } = req.body;
      const response = await appointmentService.createEvent({ datetime, duration });
      res.status(200).send(response);
    } catch (error) {
      res.status(400).send(JSON.parse(error.message));
    }
  }

  async getEvents(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).send({ error: 'StartDate and EndDate are required' });
      }

      const events = await appointmentService.getEvents(startDate, endDate);
      res.status(200).send(events);
    } catch (error) {
      res.status(500).send(JSON.parse(error.message));
    }
  }
}

module.exports = new AppointmentController();
