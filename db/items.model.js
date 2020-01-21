const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const itemSchema = new Schema({
    itemName:{
        type: String,
        required: true,
        minlength: 3,
    },
    moneyPerSecond:{
        type: Number,
        required: true,
    },
    img:{
        type: String,
        required: true,
    },
    itemID:{
        type: Number,
        required: true
    }
});

const Item = mongoose('Item', itemSchema);

module.exports = { Item };