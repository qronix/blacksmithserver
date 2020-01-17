const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const upgradeSchema = new Schema({
    name:{
        type: String,
        required: true,
        unique: true,
        minlength: 3,
    },
    description:{
        type: String,
        required: true,
        unique: true,
        minlength: 3,
    },
    maxRank:{
        type: Number,
        required: true,
    },
    cost:{
        type: Number,
        required: true,
    },
    costDelta:{
        type: Number,
        required: true
    },
    effects:{
        type: Array,
        required: true
    },
    icon:{
        type: String,
        required: true
    }
});

const Upgrade = mongoose.model('Upgrade', upgradeSchema);

module.exports = { Upgrade };