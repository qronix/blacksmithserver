const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const itemSchema = new Schema({
    itemName:{
        type: String,
        required: true,
        minlength: 3,
        unique: true,
    },
    moneyPerSecond:{
        type: Number,
        required: true,
    },
    img:{
        type: String,
    },
    itemID:{
        type: Number,
        required: true,
        unique: true
    }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = { Item };