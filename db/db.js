const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Blacksmith', { useNewUrlParser: true });


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB connection error'));
db.once('open',()=>{
    console.log('Connected to database');
});
