const moment = require('moment-timezone');
const config = require('../config/config');
const dbService = require('./DatabaseService');

class AppointmentService {
  generateTimeSlotsHour(startHour, endHour, interval) {
    const slots = [];

    // Parse the start and end hours into moment objects
    let currentTime = moment(startHour, 'HH:mm');
    const end = moment(endHour, 'HH:mm');

    while (currentTime.isBefore(end)) {
      const nextTime = currentTime.clone().add(interval, 'minutes');

      const startFormatted = currentTime.format('HH:mm');
      slots.push(`${startFormatted}`);

      currentTime = nextTime;
    }

    return slots;
  }

  generateTimeSlots(startDate, endDate, interval) {
    const slots = [];

    // generate all the possible slots in hours
    const hourSlot = generateTimeSlotsHour(config.startHour, config.endHour, config.slotDuration);

    while (startDate.isBefore(endDate)) {
      const nextTime = startDate.clone().add(interval, 'minutes');

      if (hourSlot.includes(startDate.format('HH:mm'))) {
        slots.push(startDate.utc().format());
      }

      startDate = nextTime;
    }
    return slots;
  }

  alignToNearestSlot(time) {
    const minutes = time.minutes();
    if (minutes === 0 || minutes === 30) return time;
    return time.minutes(minutes < 30 ? 30 : 0).add(minutes < 30 ? 0 : 1, 'hour').seconds(0).milliseconds(0);
  }

  async getFreeSlots(date, timezone = config.defaultTimeZone) {
    try {
      if (!date) throw new Error({ message: 'Date is required' });

      const requestDate = moment.tz(date, 'YYYY-MM-DD', timezone);
      const currentDate = moment.tz(timezone).startOf('day');

      // Throw error if user tries to fetch slots for past date
      if (requestDate.isBefore(currentDate)) {
        throw new Error({ message: 'Cannot fetch slots for past dates' });
      }

      // convert to current day's equivalent UTC timezone
      const startDate = requestDate.clone().startOf('day').utc();
      const endDate = requestDate.clone().endOf('day').utc();

      // fetching data for given date
      const eventsSnapshot = await dbService.getEvents(startDate, endDate);

      const currentTime = this.alignToNearestSlot(moment.utc());

      const startTimeCal = (currentTime.isAfter(startDate) ? currentTime : startDate).clone().tz(config.defaultTimeZone);
      const endTimeCal = endDate.clone().tz(config.defaultTimeZone);

      // fetching all possible timeslots of the doctor according to working hours
      const doctorWorkingTimeSlots = this.generateTimeSlots(startTimeCal, endTimeCal, config.slotDuration);

      //filter out results accoring to already booked events
      if (eventsSnapshot.length > 0) {
        const events = eventsSnapshot.map((doc) => doc.datetime);
        return doctorWorkingTimeSlots.filter(e => !events.includes(e)).map((doc) => moment(doc).tz(timezone).format());
      }
      else {
        return doctorWorkingTimeSlots.map((doc) => moment(doc).tz(timezone).format());
      }

    } catch (error) {
      console.error(error);
      throw new Error({ message: 'Internal server error' });
    }
  }

  async createEvent(eventData) {
    try {
      const { datetime, duration } = eventData;
      if (!datetime || !duration) throw new Error({ message: 'Invalid input' });

      // convert to start time and end time of event
      const eventStartTime = moment(datetime).utc();
      const endEventTime = eventStartTime.clone().add(duration, 'minute');

      // convert to start time and end time according to doctor's timezone
      const startTimeCal = moment(datetime).clone().startOf('day').tz(config.defaultTimeZone);
      const endTimeCal = moment(datetime).clone().endOf('day').tz(config.defaultTimeZone);

      // find all the possible doctors appointment slots
      const doctorWorkingTimeSlots = this.generateTimeSlots(startTimeCal, endTimeCal, config.slotDuration);

      let isEndDateInRange = false;
      let isStartDateInRange = false;

      doctorWorkingTimeSlots.forEach((slot) => {
        if (eventStartTime.format() === slot) {
          isStartDateInRange = true;
        }

        const momentDateEnd = moment(slot).add(config.slotDuration, 'minute').utc();
        if (momentDateEnd.diff(endEventTime, 'minute') <= config.slotDuration && momentDateEnd.isSameOrAfter(endEventTime)) {
          isEndDateInRange = true;
        }
      });

      // Throw an error in case of user tries to schedule meeting outside working hours
      if (!isEndDateInRange || !isStartDateInRange || eventStartTime.day === 0) {
        throw new Error({ message: 'Unable to schedule meeting outside working hours', type: 'error' });
      }

      let remainingDuration = duration;
      const createdEvents = [];
      const slotsToCheck = [];

      // Prepare slots for validation
      while (remainingDuration > 0) {
        const slotDuration = Math.min(config.slotDuration, remainingDuration);
        slotsToCheck.push({ datetime: eventStartTime.clone(), duration: slotDuration, parent: slotsToCheck.length > 0 ? false : true });
        eventStartTime.add(slotDuration, 'minutes');
        remainingDuration -= slotDuration;
      }

      // Check if all slots are available
      const existingEventsSnapshot = await dbService.getEventsInDateTime(slotsToCheck);

      if (!existingEventsSnapshot.empty) {
        throw new Error({ message: 'Appointment already scheduled during this time window.', type: 'warn' });
      }

      // Create all events if slots are available
      for (const slot of slotsToCheck) {
        await dbService.createEvent({ datetime: slot.datetime.format(), duration: slot.duration, parent: slot.parent, duration: slot.parent ? duration : 0 });
        createdEvents.push({ datetime: slot.datetime.format(), duration: slot.duration });
      }

      return { message: 'Your appointment has been scheduled', events: createdEvents, type: 'success' };
    } catch (error) {
      console.error(error);
      throw new Error({ message: 'Fail to schedule an appointment. Please try again after sometime', type: 'error' });
    }
  }

  async getEvents(startDate, endDate) {
    try {
      if (!startDate || !endDate) throw new Error({ message: 'StartDate and EndDate are required' });

      const start = moment(startDate).utc();
      const end = moment(endDate).utc();
      const events = await dbService.getEvents(start, end);
      return events;
    } catch (error) {
      console.error(error);
      throw new Error({ message: 'Failed to fetch events', type: 'error' });
    }
  }
}

module.exports = new AppointmentService();
