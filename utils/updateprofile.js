const moment = require('moment');
const { User } = require('../db/user.model');
const { getEmptySpaceCount, gridHasSpace, calcMoneyPerSecond, addItemToGrid } = require('../utils/gameUtils');
const { getItemInfoById } = require('../db/utils');


const updateProfile = async profile => {
    try{
        const { lastLogin, firstLogin, uid, game:{ playerData, modifiers }, game } = JSON.parse(profile);
        if(firstLogin){
            return pushProfileUpdate(uid, { firstLogin: false });
        }
        //convert UTC string to moment
        const LAST_LOGIN_MOMENT = moment(lastLogin);
        //convert current time to a utc moment
        const CURRENT_TIME = moment.utc();
        //get the difference between the utc times in seconds
        const SECONDS_SINCE_LAST_LOGIN = CURRENT_TIME.diff(LAST_LOGIN_MOMENT, 'seconds');
    
        //profile update logic:
        //update player money
        const { money } = playerData;
        const { forgeSpeed, moneyPerSecondDelta, spawnLevel } = modifiers;
        const { gridItems, currentForgeProgress } = game;
        
        let updatedItems = [...gridItems];
        let addedItemsCount = 0;
        //board has space?
        const emptySpaceCount = getEmptySpaceCount(gridItems);
        if( emptySpaceCount > 0){
            //what about modifiers?

            //calcs the amount the forge should progress since last login
            //this assumes a 50ms tick rate from client side
            //the forge should progress 20 times in one second by default at 50ms tick rate
            // const TIMES_FORGE_SHOULD_PROGRESS = (SECONDS_SINCE_LAST_LOGIN / 50) * 1000;
            const ITEMS_TO_GENERATE = Math.ceil(SECONDS_SINCE_LAST_LOGIN / 5);
            console.log("Seconds since last login: ", SECONDS_SINCE_LAST_LOGIN);
            console.log("\x1b[33m%s\x1b[0m",`Items to generate: ${ITEMS_TO_GENERATE}`);

            for(let i=0; i<ITEMS_TO_GENERATE; i++){
                const {result, grid} = addItemToGrid(updatedItems, spawnLevel);
                updatedItems = grid;
                if(result === false){
                    break;
                }
            }
        }
    
        //At current tick rate of 50ms, the forge progress bar can 
        //be expressed as 1 second = 20% of the bar => 5s = a full bar
        //Therefore, if we get the remainder of the seconds since last
        //login when divided by 5 and multiply by 20 we get a pretty
        //close representation of where the progress bar should be
        //we could use the fact that 0.001 seconds = 1/5000 of the bar
        //however to avoid complexity, I am going to use this method
        const updatedForgeProgress = (SECONDS_SINCE_LAST_LOGIN % 5) * 20;
        const moneyPerSecond = await calcMoneyPerSecond(updatedItems, moneyPerSecondDelta);
        const updatedMoney = (money + ((moneyPerSecond * moneyPerSecondDelta) * SECONDS_SINCE_LAST_LOGIN));
        
        const updatedProfile = {
            game:{
                ...game,
                gridItems:updatedItems,
                playerData:{
                    ...playerData,
                    moneyPerSecond,
                    money: updatedMoney,
                },
                currentForgeProgress:updatedForgeProgress,
            }
        }
        return pushProfileUpdate(uid, updatedProfile);
    }
    catch(err){
        console.error('Profile update error: ', err.message);
    }
}

const pushProfileUpdate = (uid, changes) => {
    return new Promise(async (res, rej) => {
        try{
            await User.updateOne({uid}, {...changes});
            res(changes);
        }catch(err){
            console.error('Profile update error: ', err.message);
            rej(new Error('Could not update profile'));
        }
    });
}

module.exports = { updateProfile };