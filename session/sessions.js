const moment = require('moment');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const { User } = require('../db/user.model');

const { 
    gridHasSpace, 
    addItemToGrid, 
    calcMoneyPerSecond,
    moveItems,
    mergeItems,
    getItemMoneyPerSecond,
    calcMergeMPS,
    calcAddItemMPS,
} = require('../utils/gameUtils');

const { PRIVATE_KEY } = require('./privateKey');

const SESSIONS = new Map();
const SESSION_ID_MAP = new Map();


//need to add a queue system for changes

const findSessionById = id => {
    return SESSIONS.get(id) || false;
}

const findSessionBySessionId = id => {
    return SESSION_ID_MAP.get(id) || false;
}

const getSessionDataBySessionId = id => {
    // console.log('Got session id: ', id);
    try{
        const targetUid = SESSION_ID_MAP.get(id);
        //TODO: send modifiers and upgrades
        const { game }  = SESSIONS.get(targetUid);
        if(game){
            // console.log('Found session data by session id');
            return game;
        }else{
            return null;
        }
    }catch(err){
        console.log('Could not get session by Id: ', err.message);
        return null;
    }
}

const getBetweenUpdateAndNow = lastUpdate => {
    const CURRENT_TIME = moment.utc();
    //change to milliseconds
    const difference = CURRENT_TIME.diff(lastUpdate, 'seconds');
    // console.log(`It has been ${difference} seconds since the last update`);
    return difference;
}

const checkForGridSpace = uid => {
    const { game:{ gridItems } } = SESSIONS.get(uid);
    const hasSpace = gridHasSpace(gridItems);
    return hasSpace;
}

const updateMoneyBySessionId = (sessionID, clientMoney) => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionID);
        const previousData = SESSIONS.get(targetUid);
        const { 
            game:{
                playerData:{money, moneyPerSecond},
                modifiers:{
                    moneyPerSecondDelta
                },
                gridItems
            },
            lastUpdate,
        } = previousData;
        // console.log('Session is: ', SESSIONS.get())
        let TIME_DIFFERENCE_SINCE_UPDATE = getBetweenUpdateAndNow(lastUpdate);

        if(TIME_DIFFERENCE_SINCE_UPDATE < 1){
            TIME_DIFFERENCE_SINCE_UPDATE = 1;
        }

        // debugger
        if(typeof money === NaN){
            console.trace('Money is NaN');
        }
        console.log(`Money: ${money}`);
        console.log(`MoneyPerSecond: ${moneyPerSecond}`);
        console.log(`MoneyPerSecondDelta: ${moneyPerSecondDelta}`);
        //Is this vulnerable?
        const correctMoney = (money + ((moneyPerSecond * moneyPerSecondDelta) * TIME_DIFFERENCE_SINCE_UPDATE));
        console.log(`Correct money calculated as: ${correctMoney}`);
        console.log(`Client sent money as: ${clientMoney}`);
        console.log(`These money amounts match: ${correctMoney === clientMoney}`);
        if(correctMoney !== clientMoney){
            console.log('Current grid items: ');
            console.dir(gridItems);
        }
        console.log('Updating session (money)!');
        SESSIONS.set(targetUid, { ...previousData, game:{...previousData.game, playerData:{ ...previousData.game.playerData, money:correctMoney }}, lastUpdate:moment.utc() });

        if(correctMoney === clientMoney){
            return true;
        }else{
            return false;
        }
    }catch(err){
        console.log('Update money error: ', err.message);
        return false;
    }
}

const addItemBySessionId = async sessionID => {
    const targetUid = SESSION_ID_MAP.get(sessionID);
    const previousData = SESSIONS.get(targetUid);
    const { 
        lastItem, 
        game:{ 
            gridItems, 
            currentForgeProgress, 
            modifiers:{ 
                forgeSpeed, 
                spawnLevel, 
                moneyPerSecondDelta 
            }, 
            playerData:{ 
                moneyPerSecond 
            } 
        } 
    } = previousData;
    const hasSpaceForItem = checkForGridSpace(targetUid);

    // console.log('Calling add item');
    // console.log('Current forge progress: ', currentForgeProgress);
    if(hasSpaceForItem){
        if(lastItem){
            const CURRENT_TIME = moment.utc();
            const TIME_DIFFERENCE_SINCE_UPDATE = CURRENT_TIME.diff(lastItem, 'seconds');
            const FORGE_TICK_RATE = 20; //20 times per second at 50ms tick rate
            const UPDATED_FORGE_PROGRESS = ((currentForgeProgress + ((FORGE_TICK_RATE * TIME_DIFFERENCE_SINCE_UPDATE) * forgeSpeed)) / 100);
            if(UPDATED_FORGE_PROGRESS < 1){
                console.log('Hacking detected! An item was attempted to be added before allowed');
                return false;
            }
            if(UPDATED_FORGE_PROGRESS >= 1){
                //update forge progress to remainder * 100
                // SESSIONS.set(targetUid, { ...previousData, game:{...previousData.game, currentForgeProgress:0} })
                UPDATED_FORGE_PROGRESS = 0;
            }
            // console.log(`Updated forge progress: ${ UPDATED_FORGE_PROGRESS }`);
            // console.log('Updating session: (add item)!');
            SESSIONS.set(targetUid, {...previousData, game:{...previousData.game, currentForgeProgress:UPDATED_FORGE_PROGRESS }, lastItem:moment.utc()});
        }else{
            // console.log('Updating session: (add item)!');
            SESSIONS.set(targetUid, { ...previousData, game:{...previousData.game, currentForgeProgress:0}, lastItem:moment.utc() });
            // console.log(`Updated forge progress: 0`);
        }
        //TODO add item
        const {result, grid} = addItemToGrid(gridItems, spawnLevel);
        const itemMPS = getItemMoneyPerSecond(spawnLevel);
        if(result === true){
            const updatedMoneyPerSecond = calcAddItemMPS(moneyPerSecond, moneyPerSecondDelta, itemMPS);
            // console.log('Updating session: (add item)!');
            SESSIONS.set(targetUid, { ...previousData, game:{ ...previousData.game, gridItems: grid, playerData:{ ...previousData.game.playerData, moneyPerSecond:updatedMoneyPerSecond } } });
            // console.log('New item added to grid and MPS updated!');
            return true;
        }
        return false;
    }else{
        console.log('No space for items! Stop cheating!');
        return false;
    }
}

const moveItemForSessionId = async (sessionID, request) => {
    const targetUid = SESSION_ID_MAP.get(sessionID);
    const { game:{ gridItems, } } = SESSIONS.get(targetUid);

    try{
        const { result, grid } = moveItems(gridItems, request);
        debugger
        if(result === true){
            const previousData = SESSIONS.get(targetUid);
            // console.log('previous data spread: ', {...previousData});
            // let testData = {...previousData, game:{ ...previousData.game, gridItems:grid }};
            // console.log('test data: ', testData);
            // console.log('Updating session: (move item)!');
            //TODO
            //Do you really need to recalc mps when MOVING an item?
            //You can only move an item to an empty space, no mps changes should occur

            // const moneyPerSecond = await calcMoneyPerSecond(grid, moneyPerSecondDelta);

            SESSIONS.set(targetUid, { ...previousData, game:{ ...previousData.game, gridItems:grid } });
            //calc money per second?
            return { result:true, grid };
        }else{
            return { result:false, grid };
        }
    }catch(err){
        debugger
        console.log('Move item error: ', err.message);
        return { result:false, grid:gridItems };
    }
}

const mergeItemsForSessionId = async (sessionID, request) => {
    const targetUid = SESSION_ID_MAP.get(sessionID);
    const { game:{ gridItems, modifiers:{ moneyPerSecondDelta }, playerData:{moneyPerSecond} } } = SESSIONS.get(targetUid);
    // console.log('merge request: ', request);
    try{
        const { result, grid, newItemId, removedItemId } = mergeItems(gridItems, request);
       
        if(result === true){
            const previousData = SESSIONS.get(targetUid);
            // console.log('testData: ', {...previousData, game:{ ...previousData.game, gridItems:grid } });
            // console.log('Updating session: (merge item)!'); 
            // const moneyPerSecond = await calcMoneyPerSecond(grid, moneyPerSecondDelta);
            const addItemMPS = getItemMoneyPerSecond(newItemId);
            const removeItemMPS = getItemMoneyPerSecond(removedItemId);
            const correctMPS = calcMergeMPS(moneyPerSecond, moneyPerSecondDelta, addItemMPS, removeItemMPS);
            console.log('Got MPS from merge mps as: ', correctMPS);
            SESSIONS.set(targetUid, { ...previousData, game:{ ...previousData.game, gridItems:grid, playerData:{ ...previousData.game.playerData, moneyPerSecond:correctMPS } } });
            debugger
            return { result:true, grid };
        }else{
            return { result:false, grid };
        }
    }catch(err){
        debugger
        console.log('Merge items error: ', err.message);
        return { result:false, grid:gridItems };
    }
}

const addSession = data => {
    //check user id is not in sessions list
    const { uid } = data;
    const userHasSession = findSessionById(uid);
    if(!userHasSession){
        // console.log('Updating session: (add session)!');
        SESSIONS.set(uid, { ...data, lastUpdate:moment.utc(), lastItem:null });
        const { sessionID } = data;
        SESSION_ID_MAP.set(sessionID, uid);
        debugger
        return true;
    }else{
        console.log('Cannot add session. A session already exists for that user');
        return false;
    }
}

const clearSessionById = uid => {
    return SESSIONS.delete(uid);
}

const removeSessionBySessionId = async sessionId => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionId);
        await saveSessionBySessionId(sessionId);
        SESSIONS.delete(targetUid);
        // console.log('Client session has been removed');
        return true;
    }catch(err){
        console.log('Could not delete user session by id: ', err.message);
        return false;
    }
}

const saveSessionBySessionId = async sessionID => {
    const targetUid = SESSION_ID_MAP.get(sessionID);
    const sessionData = SESSIONS.get(targetUid);
    const lastLogin = moment.utc().valueOf();
    const result = await User.updateOne({ uid:targetUid },  { ...sessionData, lastLogin });
    console.log('Saved session: ', result);
    console.log('Saving money as: ', sessionData.game.playerData.money);
}

const generateSessionIdAndToken = (data = {}) => {
    try{
        const { uid } = data;
        const userHasSession = findSessionById(uid);
        // console.log('user session: ', userHasSession);
        if(!userHasSession){
            //TODO: add check to ensure uuid is unique?
            const sessionID = uuid();
            const token = jwt.sign(sessionID, PRIVATE_KEY);
            const sessionWasAdded = addSession({ ...data, token, sessionID });
            if(sessionWasAdded){
                return {sessionID, token};
            }else{
                return null;
            }
        }else{
            console.log(`User with id ${ uid } already has a session!`);
            return null;
        }
    }
    catch(err){
        console.log('Session generation error: ', err.message);
    }
}


module.exports = {
    findSessionById,
    findSessionBySessionId,
    clearSessionById,
    removeSessionBySessionId,
    generateSessionIdAndToken,
    getSessionDataBySessionId,
    updateMoneyBySessionId,
    addItemBySessionId,
    mergeItemsForSessionId,
    moveItemForSessionId,
}