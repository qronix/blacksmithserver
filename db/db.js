const mongoose = require('mongoose');
// const url = `mongodb://${process.env.MONGO_USERNAME}
// :${process.env.MONGO_PASSWORD}
// @${process.env.MONGO_HOSTNAME}
// :${process.env.MONGO_PORT}
// /${process.env.MONGO_DB}
// ?authSource=admin`;
const url = 'mongodb://localhost/Blacksmith';
mongoose.connect(url, { useNewUrlParser: true });


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB connection error'));
db.once('open',() => {
    console.log('Connected to database');
});

module.exports={ db };