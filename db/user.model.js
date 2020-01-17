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
    lastLogin:{
        type: Date,
        default: Date.now()
    },
    game:{
        premium:{
            type: Number,
            default: 0,
        },
        gridItems:{
            type: Array,
            default:[
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
            ]
        },
        playerData:{
            type:Object,
            default:{
                money:0,
                moneyPerSecond:0
            }
        },
        //create stand alone model
        upgrades:{
            type: Array,
            default:[
                {
                    name:'Forge Level',
                    description:'Items spawn at a higher level',
                    rank:0,
                    cost:10000,
                    costDelta:5,
                    effects:[0],
                    active:false,
                    icon:'/imgs/dag_01.png'
                },
                {
                    name: 'Forge Speed',
                    description: 'Forge generates items faster',
                    rank:0,
                    cost:500000,
                    costDelta:4,
                    effects:[1],
                    active:false,
                    icon:'/imgs/hm_t_02.png'
                },
                {
                    name: 'Golden Anvil',
                    description: 'Items are merged automatically',
                    rank:0,
                    cost:10000000,
                    costDelta:5,
                    effects:[2],
                    active: false,
                    icon:'/imgs/bl_t_01.png'
                }
            ]
        },

    }
});

const User = mongoose.model('User', userSchema);

module.exports = {
    User
}