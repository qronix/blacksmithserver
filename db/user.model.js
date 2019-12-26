const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const { validateEmail } = require('../utils/validate');


let userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        minlength: 5,
    },
    uid:{
        type: String,
        required: true,
    },
    created:{
        type: Date,
        default: Date.now(),
    },
    game:{
        money:{
            type: Number,
            default: 0,
        },
        premium:{
            type: Number,
            default: 0,
        }
    }
});

const user = mongoose.model('User', userSchema);