const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const effectSchema = new Schema({
    name:{
        type: String,
        required: true,
        minlength: 3,
        unique:true,
    },
    modifier:{
        type: Object,
        required: true,
    },
    effectID:{
        type: Number,
        required: true,
        unique: true,
    }
});

const Effect = mongoose.model('Effect', effectSchema);

module.exports = { Effect };