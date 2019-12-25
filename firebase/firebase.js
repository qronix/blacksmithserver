const admin = require('firebase-admin');

process.env.GOOGLE_APPLICATION_CREDENTIALS = './firebase/firebaseKey.json';

const serviceAccount = require('./firebaseKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://blacksmith-ed73e.firebaseio.com"
});

module.exports{
    admin,
}