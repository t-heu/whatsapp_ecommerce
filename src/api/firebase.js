const firebase = require('firebase/app');
const { getDatabase, ref, set, onValue, update, get, child, onDisconnect, remove, push } = require('firebase/database');
const { getAnalytics, isSupported } = require('firebase/analytics');

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

const app = firebase.initializeApp(firebaseConfig);
const database = getDatabase(app);
isSupported().then(yes => yes ? getAnalytics(app) : null);

module.exports = { 
  firebase, 
  database, 
  ref, 
  set, 
  onValue, 
  update, 
  get, 
  child, 
  onDisconnect, 
  remove, 
  push 
};
