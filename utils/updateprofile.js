const moment = require('moment');
const { User } = require('../db/user.model');
const { getEmptySpaceCount, gridHasSpace } = require('../utils/gameUtils');
const { getItemInfoById } = require('../db/utils');


const updateProfile = async profile => {
    try{
        console.log('PROFILE: ', profile);
        console.log('PROFILE PARSED: ', JSON.parse(profile));
        const { lastLogin, firstLogin, uid, game:{ playerData, modifiers }, game } = JSON.parse(profile);
        console.log('GAME: ', game);
        if(firstLogin){
            return pushProfileUpdate(uid, { firstLogin: false });
        }
        //convert UTC string to moment
        const LAST_LOGIN_MOMENT = moment(lastLogin);
        //convert current time to a utc moment
        const CURRENT_TIME = moment.utc();
        //get the difference between the utc times in seconds
        const SECONDS_SINCE_LAST_LOGIN = CURRENT_TIME.diff(LAST_LOGIN_MOMENT, 'seconds');
        // console.log('Seconds since last login: ', SECONDS_SINCE_LAST_LOGIN);
        
    
        //profile update logic:
        //update player money
        //profile.game.playerData.moneyPerSecond * SECONDS_SINCE_LAST_LOGIN * profile.game.modifiers.moneyPerSecondDelta
        const { money, moneyPerSecond } = playerData;
        const { forgeSpeed, moneyPerSecondDelta, spawnLevel } = modifiers;
        const { gridItems, currentForgeProgress } = game;
        
        let updatedItems = [...gridItems];
        let addedItemsCount = 0;
        //board has space?
        const emptySpaceCount = getEmptySpaceCount(gridItems);
        if( emptySpaceCount > 0){
            // let progress = currentForgeProgress;
            // const progressDelta = forgeSpeed;
            //what about modifiers?
            const TIMES_FORGE_SHOULD_PROGRESS = (SECONDS_SINCE_LAST_LOGIN * 1000) / 50;
            
            // console.log('Spawn level: ', spawnLevel);

            //BUG HERE FIX IT INFINITE LOOP
            // for(let i = 0; i < TIMES_FORGE_SHOULD_PROGRESS; i++){
            //     if(gridHasSpace(updatedItems)){
            //         updatedItems.push(spawnLevel);
            //         addedItemsCount++;
            //     }else{
            //         break;
            //     }
            // }
        }
    
        //At current tick rate of 50ms, the forge progress bar can 
        //be expressed as 1 second = 20% of the bar => 5s = a full bar
        //Therefore, if we get the remainder of the seconds since last
        //login when divided by 5 and multiply by 20 we get a pretty
        //close representation of where the progress bar should be
        //we could use the fact that 0.001 seconds = 1/5000 of the bar
        //however to avoid complexity, I am going to use this method
        const updatedForgeProgress = (SECONDS_SINCE_LAST_LOGIN % 5) * 20;
        const updatedMoney = (((money * moneyPerSecond) * moneyPerSecondDelta) * SECONDS_SINCE_LAST_LOGIN);
    
        //calc new money per second
        const { moneyPerSecond:addedItemMPS } = await getItemInfoById(spawnLevel);
        const updatedMoneyPerSecond = (moneyPerSecond + (addedItemMPS * addedItemsCount));
        
        const updatedProfile = {
            game:{
                ...game,
                gridItems:updatedItems,
                playerData:{
                    ...playerData,
                    moneyPerSecond:updatedMoneyPerSecond,
                    money: updatedMoney,
                },
                currentForgeProgress:updatedForgeProgress,
            }
        }
        return pushProfileUpdate(uid, updatedProfile);
    }
    catch(err){
        console.log('Profile update error: ', err.message);
    }
}

const pushProfileUpdate = (uid, changes) => {
    console.log('Applying profile changes: ', changes);
    return new Promise(async (res, rej) => {
        try{
            await User.updateOne({uid}, {...changes});
            res(changes);
        }catch(err){
            console.log('Profile update error: ', err.message);
            rej(new Error('Could not update profile'));
        }
    });
}

module.exports = { updateProfile };