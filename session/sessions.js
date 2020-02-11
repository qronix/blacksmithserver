const moment = require('moment');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const { gridHasSpace } = require('../utils/gameUtils');

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
    console.log(`It has been ${difference} seconds since the last update`);
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
                }
            },
            lastUpdate,
        } = previousData;
        // console.log('Session is: ', SESSIONS.get())
        const TIME_DIFFERENCE_SINCE_UPDATE = getBetweenUpdateAndNow(lastUpdate);
        // console.log(`Money: ${money}`);
        // console.log(`MoneyPerSecond: ${moneyPerSecond}`);
        // console.log(`MoneyPerSecondDelta: ${moneyPerSecondDelta}`);
        const correctMoney = (money + ((moneyPerSecond * moneyPerSecondDelta) * TIME_DIFFERENCE_SINCE_UPDATE));
        // console.log(`Correct money calculated as: ${correctMoney}`);
        // console.log(`Client sent money as: ${clientMoney}`);
        // console.log(`These money amounts match: ${correctMoney === clientMoney}`);
        SESSIONS.set(targetUid, {...previousData, game:{...previousData.game, playerData:{ ...previousData.game.playerData, correctMoney }}, lastUpdate:moment.utc()});
        // console.log('Updated data: ', SESSIONS.get(targetUid));

    }catch(err){
        console.log('Update money error: ', err.message);
        return false;
    }
}

const addItemBySessionId = sessionID => {
    const targetUid = SESSION_ID_MAP.get(sessionID);
    const previousData = SESSIONS.get(targetUid);
    const { lastItem, game:{ currentForgeProgress, modifiers:{ forgeSpeed } } } = previousData;
    const hasSpaceForItem = checkForGridSpace(targetUid);

    console.log('Calling add item');
    console.log('Current forge progress: ', currentForgeProgress);
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
                SESSIONS.set(targetUid, { ...previousData, game:{...previousData.game, currentForgeProgress:0} })
            }
            console.log(`Updated forge progress: ${ UPDATED_FORGE_PROGRESS }`);
            SESSIONS.set(targetUid, {...previousData, lastItem:moment.utc()});
        }else{
            SESSIONS.set(targetUid, { ...previousData, game:{...previousData.game, currentForgeProgress:0}, lastItem:moment.utc() });
            console.log(`Updated forge progress: 0`);
        }
        return true;
    }else{
        console.log('No space for items! Stop cheating!');
        return false;
    }
}

const addSession = data => {
    //check user id is not in sessions list
    const { uid } = data;
    const userHasSession = findSessionById(uid);
    if(!userHasSession){
        SESSIONS.set(uid, { ...data, lastUpdate:moment.utc(), lastItem:null });
        const { sessionID } = data;
        SESSION_ID_MAP.set(sessionID, uid);
        return true;
    }else{
        console.log('Cannot add session. A session already exists for that user');
        return false;
    }
}

const clearSessionById = uid => {
    return SESSIONS.delete(uid);
}

const removeSessionBySessionId = sessionId => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionId);
        SESSIONS.delete(targetUid);
        // console.log('Client session has been removed');
        return true;
    }catch(err){
        console.log('Could not delete user session by id: ', err.message);
        return false;
    }
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
}