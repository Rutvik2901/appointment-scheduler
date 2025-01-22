const dotenv = require('dotenv');
const assert = require('assert');

dotenv.config();

const {
  PORT,
  HOST,
  HOST_URL,
  API_KEY,
  AUTH_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
  START_HOURS, 
  END_HOURS, 
  SLOT_DURATION, 
  DEFAULT_TIMEZONE
} = process.env;

assert(PORT, 'Port is required');
assert(HOST, 'Host is required');

module.exports = {
    port: PORT,
    host: HOST,
    hostUrl: HOST_URL,
    firebaseConfig: {
      apiKey: API_KEY,
      authDomain: AUTH_DOMAIN,
      projectId: PROJECT_ID,
      storageBucket: STORAGE_BUCKET,
      messagingSenderId: MESSAGING_SENDER_ID,
      appId: APP_ID,
    },
    startHour: START_HOURS,
    endHour: END_HOURS,
    slotDuration: SLOT_DURATION,
    defaultTimeZone: DEFAULT_TIMEZONE
  };
