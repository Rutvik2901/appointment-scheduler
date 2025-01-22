const moment = require('moment-timezone');
const config = require('../config/config');
const dbService = require('./DatabaseService');

class AppointmentService {
  generateTimeSlotsHour(startHour, endHour, interval) {
    const slots = [];
    let currentTime = moment(startHour, 'HH:mm');
    const end = moment(endHour, 'HH:mm');

    while (currentTime.isBefore(end)) {
      slots.push(currentTime.format('HH:mm'));
      currentTime.add(interval, 'minutes');
    }

    return slots;
  }

  generateTimeSlots(startDate, endDate, interval) {
    const slots = [];
    const hourSlots = this.generateTimeSlotsHour(config.startHour, config.endHour, config.slotDuration);

    while (startDate.isBefore(endDate)) {
      const nextTime = startDate.clone().add(interval, 'minutes');
      if (hourSlots.includes(startDate.format('HH:mm'))) {
        slots.push(startDate.utc().format());
      }
      startDate = nextTime;
    }

    return slots;
  }

  alignToNearestSlot(time) {
    const minutes = time.minutes();
    if (minutes === 0 || minutes === 30) return time;
    return time
      .minutes(minutes < 30 ? 30 : 0)
      .add(minutes < 30 ? 0 : 1, 'hour')
      .seconds(0)
      .milliseconds(0);
  }

  async getFreeSlots(date, timezone) {
    const requestDate = moment.tz(date, 'YYYY-MM-DD', timezone);
    const currentDate = moment.tz(timezone).startOf('day');

    if (requestDate.isBefore(currentDate)) {
      throw new Error('Cannot fetch slots for past dates');
    }

    const startDate = requestDate.clone().startOf('day').utc();
    const endDate = requestDate.clone().endOf('day').utc();
    const currentTime = this.alignToNearestSlot(moment.utc());

    const startTimeCal = (currentTime.isAfter(startDate) ? currentTime : startDate)
      .clone()
      .tz(config.defaultTimeZone);
    const endTimeCal = endDate.clone().tz(config.defaultTimeZone);

    const doctorWorkingTimeSlots = this.generateTimeSlots(startTimeCal, endTimeCal, config.slotDuration);

    const events = await dbService.getEvents(startDate, endDate);

    if (events.length > 0) {
      const bookedTimes = events.map((e) => e.datetime);
      return doctorWorkingTimeSlots.filter((slot) => !bookedTimes.includes(slot));
    }

    return doctorWorkingTimeSlots;
  }

  async createEvent(eventData) {
    const { datetime, duration } = eventData;
    if (!datetime || !duration) {
      throw new Error('Invalid input');
    }

    const eventStartTime = moment(datetime).utc();
    const endEventTime = eventStartTime.clone().add(duration, 'minute');
    const startTimeCal = moment(datetime).clone().startOf('day').tz(config.defaultTimeZone);
    const endTimeCal = moment(datetime).clone().endOf('day').tz(config.defaultTimeZone);

    const doctorWorkingTimeSlots = this.generateTimeSlots(startTimeCal, endTimeCal, config.slotDuration);

    if (
      !doctorWorkingTimeSlots.includes(eventStartTime.format()) ||
      eventStartTime.day() === 0 ||
      endEventTime.isAfter(moment(doctorWorkingTimeSlots[doctorWorkingTimeSlots.length - 1]).add(config.slotDuration, 'minute'))
    ) {
      throw new Error('Unable to schedule meeting outside working hours');
    }

    const existingEvents = await dbService.getEvents(eventStartTime, endEventTime);

    if (existingEvents.length > 0) {
      throw new Error('Appointment already scheduled during this time window.');
    }

    await dbService.createEvent({ datetime: eventStartTime.format(), duration });
    return { message: 'Your appointment has been scheduled successfully' };
  }

  async getEvents(startDate, endDate) {
    try {
      const start = moment(startDate).utc();
      const end = moment(endDate).utc();
      const events = await dbService.getEvents(start, end);
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }
}

module.exports = new AppointmentService();
