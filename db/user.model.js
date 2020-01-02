const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const { validateEmail } = require('../utils/validate');


let userSchema = new Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        validate:{
            validator:v=>{ validateEmail(v) },
            message: props => `${props.value} is not a valid email`
        }
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

const User = mongoose.model('User', userSchema);

module.exports = {
    User
}