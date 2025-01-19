const config = require('./config.js');
const { initializeApp } = require('firebase/app');

const firebase = initializeApp(config.firebaseConfig);

module.exports = firebase;