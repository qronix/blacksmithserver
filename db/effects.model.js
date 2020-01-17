const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const effectSchema = new Schema({
    name:{
        type: String,
        required,
        minlength: 3,
    },
    modifier:{
        type: Object,
        required
    },
});

const Effect = mongoose.model('Effect', effectSchema);

module.exports = { Effect };