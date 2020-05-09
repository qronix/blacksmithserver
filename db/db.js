const mongoose = require('mongoose');
console.log('OUR DB: ', process.env.MONGO_DB);
const url = `mongodb://${process.env.MONGO_USERNAME}
:${process.env.MONGO_PASSWORD}
@${process.env.MONGO_HOSTNAME}
:${process.env.MONGO_PORT}
/${process.env.MONGO_DB}
?authSource=admin`;
mongoose.connect(url, { useNewUrlParser: true });


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB connection error'));
db.once('open',() => {
    console.log('Connected to database');
});

module.exports={ db };