const {firebaseConfig} = require('./config/config');
const { initializeApp } = require('firebase/app');

const firebase = initializeApp(firebaseConfig);

module.exports = firebase;