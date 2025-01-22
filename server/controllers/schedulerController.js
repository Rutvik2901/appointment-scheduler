const firebase =  require('../config/firebaseconfig.js');
const config = require('../config/config.js');
const moment = require('moment-timezone');

const {getFirestore, collection, addDoc, getDocs, query, where} = require('firebase/firestore');

const db = getFirestore(firebase);

function generateTimeSlotsHour(startHour, endHour, interval) {
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

function generateTimeSlots(startDate, endDate, interval) {
  const slots = [];

  // generate all the possible slots in hours
  const hourSlot = generateTimeSlotsHour(config.startHour, config.endHour, config.slotDuration);

  while (startDate.isBefore(endDate)) {
    const nextTime = startDate.clone().add(interval, 'minutes');

    if(hourSlot.includes(startDate.format('HH:mm'))) {
      slots.push(startDate.utc().format());
    }

    startDate = nextTime;
  }
  return slots;
}

const alignToNearestSlot = (time) => {
  const minutes = time.minutes();
  if (minutes === 0 || minutes === 30) return time;
  return time.minutes(minutes < 30 ? 30 : 0).add(minutes < 30 ? 0 : 1, 'hour').seconds(0).milliseconds(0);
};

// API to get free slots
const getFreeSlots = async (req, res) => {
  try {
    const { date, timezone = config.defaultTimeZone } = req.query;
    if (!date) return res.status(400).send({ error: 'Date is required' });

    const requestDate = moment.tz(date, 'YYYY-MM-DD', timezone);
    const currentDate = moment.tz(timezone).startOf('day');

    // Throw error if user tries to fetch slots for past date
    if (requestDate.isBefore(currentDate)) {
      return res.status(400).send({ error: 'Cannot fetch slots for past dates' });
    }

    // convert to current day's equivalent UTC timezone
    const startDate = requestDate.clone().startOf('day').utc();
    const endDate = requestDate.clone().endOf('day').utc();

    // fetching data for given date
    const eventsSnapshot = await getDocs(
      query(
        collection(db, 'events'),
        where('datetime', '>=', startDate.format()),
        where('datetime', '<=', endDate.format())
      )
    );

  const currentTime = alignToNearestSlot(moment.utc());

  const startTimeCal = (currentTime.isAfter(startDate) ? currentTime : startDate).clone().tz(config.defaultTimeZone);
  const endTimeCal = endDate.clone().tz(config.defaultTimeZone);

  // fetching all possible timeslots of the doctor according to working hours
  const doctorWorkingTimeSlots = generateTimeSlots(startTimeCal, endTimeCal, config.slotDuration);

  //filter out results accoring to already booked events
  if(eventsSnapshot.docs.length > 0) {
    const events = eventsSnapshot.docs.map((doc) => doc.data().datetime);
    return res.status(200).send(doctorWorkingTimeSlots.filter(e => !events.includes(e)).map((doc) => moment(doc).tz(timezone).format()));
  }
  else {
    return res.status(200).send(doctorWorkingTimeSlots.map((doc) => moment(doc).tz(timezone).format()));
  }

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
};

// API to create an event
const createEvent = async (req, res) => {
  try {
    const { datetime, duration } = req.body;
    if (!datetime || !duration) return res.status(400).send({ error: 'Invalid input' });

    // convert to start time and end time of event
    const eventStartTime = moment(datetime).utc();
    const endEventTime = eventStartTime.clone().add(duration, 'minute');

    // convert to start time and end time according to doctor's timezone
    const startTimeCal = moment(datetime).clone().startOf('day').tz(config.defaultTimeZone);
    const endTimeCal = moment(datetime).clone().endOf('day').tz(config.defaultTimeZone);
  
    // find all the possible doctors appointment slots
    const doctorWorkingTimeSlots = generateTimeSlots(startTimeCal, endTimeCal, config.slotDuration);

    let isEndDateInRange = false;
    let isStartDateInRange = false;

    doctorWorkingTimeSlots.forEach((slot) => {
      if(eventStartTime.format() === slot) {
        isStartDateInRange = true;
      }

      const momentDateEnd = moment(slot).add(config.slotDuration, 'minute').utc();
      if(momentDateEnd.diff(endEventTime, 'minute') <= config.slotDuration && momentDateEnd.isSameOrAfter(endEventTime)) {
        isEndDateInRange = true;
      }
    });

    // Throw an error in case of user tries to schedule meeting outside working hours
    if (!isEndDateInRange || !isStartDateInRange || eventStartTime.day === 0) {
      return res.status(400).send({ message: 'Unable to schedule meeting outside working hours', type: 'error' });
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
    const existingEventsSnapshot = await getDocs(
      query(
        collection(db, 'events'),
        where('datetime', 'in', slotsToCheck.map((slot) => slot.datetime.format()))
      )
    );

    if (!existingEventsSnapshot.empty) {
      return res.status(422).send({ message: 'Appointment already scheduled during this time window.', type: 'warn' });
    }

    // Create all events if slots are available
    for (const slot of slotsToCheck) {
      await addDoc(collection(db, 'events'), { datetime: slot.datetime.format(), duration: slot.duration, parent: slot.parent, duration: slot.parent ? duration : 0 });
      createdEvents.push({ datetime: slot.datetime.format(), duration: slot.duration });
    }

    res.status(200).send({ message: 'Your appointment has been scheduled', events: createdEvents, type: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Fail to schedule an appointment. Please try again after sometime', type: 'error' });
  }
};

// API to get events based on dates
const getEvents = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).send({ error: 'StartDate and EndDate are required' });

    const eventsSnapshot = await getDocs(
      query(
        collection(db, 'events'),
        where('datetime', '>=', moment(startDate).utc().format()),
        where('datetime', '<=', moment(endDate).utc().format())
      )
    );

    const events = eventsSnapshot.docs.map((doc) => doc.data());
    res.status(200).send(events);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
};

module.exports = {
  getFreeSlots, createEvent, getEvents
}