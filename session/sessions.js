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

const findSessionById = id => {
    try{
        return SESSIONS.get(id) || false;
    }catch(err){
        console.error('Find session by id error: ', err.message);
    }
}

const findSessionBySessionId = id => {
    try{
        return SESSION_ID_MAP.get(id) || false;
    }catch(err){
        console.error('Find session by session id error: ', err.message);
    }
}

const getSessionDataBySessionId = id => {
    try{
        const targetUid = SESSION_ID_MAP.get(id);
        //TODO: send modifiers and upgrades
        const { game }  = SESSIONS.get(targetUid);
        if(game){
            return game;
        }else{
            throw new Error(`Could not find game session for id: ${targetUid}`)
        }
    }catch(err){
        console.error('Get session data by session id error: ', err.message);
        return null;
    }
}

const getBetweenUpdateAndNow = lastUpdate => {
    try{
        const CURRENT_TIME = moment.utc();
        const difference = CURRENT_TIME.diff(lastUpdate, 'seconds');
        return difference;
    }catch(err){
        console.error('Get between update and now error: ', err.message);
    }
}

const checkForGridSpace = uid => {
    try{
        const { game:{ gridItems } } = SESSIONS.get(uid);
        const hasSpace = gridHasSpace(gridItems);
        return hasSpace;
    }catch(err){
        console.error('Check for grid space error: ', err.message)
    }
}

const updateMoneyBySessionId = sessionID => {
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
        let TIME_DIFFERENCE_SINCE_UPDATE = getBetweenUpdateAndNow(lastUpdate);

        if(TIME_DIFFERENCE_SINCE_UPDATE < 1){
            TIME_DIFFERENCE_SINCE_UPDATE = 1;
        }

        // console.log(`Money: ${money}`);
        // console.log(`MoneyPerSecond: ${moneyPerSecond}`);
        // console.log(`MoneyPerSecondDelta: ${moneyPerSecondDelta}`);
        //Is this vulnerable?
        const correctMoney = (money + ((moneyPerSecond * moneyPerSecondDelta) * TIME_DIFFERENCE_SINCE_UPDATE));
        // console.log(`Correct money calculated as: ${correctMoney}`);
        // console.log('Updating session (money)!');
        SESSIONS.set(targetUid, { ...previousData, game:{...previousData.game, playerData:{ ...previousData.game.playerData, money:correctMoney }}, lastUpdate:moment.utc() });
    }catch(err){
        console.error('Update money error: ', err.message);
        return false;
    }
}

const addItemBySessionId = sessionID => {
    try{
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
    
        if(hasSpaceForItem){
            if(lastItem){
                const CURRENT_TIME = moment.utc();
                const TIME_DIFFERENCE_SINCE_UPDATE = CURRENT_TIME.diff(lastItem, 'seconds');
                const FORGE_TICK_RATE = 20; //20 times per second at 50ms tick rate
                const UPDATED_FORGE_PROGRESS = ((currentForgeProgress + ((FORGE_TICK_RATE * TIME_DIFFERENCE_SINCE_UPDATE) * forgeSpeed)) / 100);
                if(UPDATED_FORGE_PROGRESS < 1){
                    console.log('Hacking detected! An item was attempted to be added before allowed');
                    return {result:false, grid:gridItems};
                }
                if(UPDATED_FORGE_PROGRESS >= 1){
                    UPDATED_FORGE_PROGRESS = 0;
                }
                SESSIONS.set(targetUid, {...previousData, game:{...previousData.game, currentForgeProgress:UPDATED_FORGE_PROGRESS }, lastItem:moment.utc()});
            }else{
                SESSIONS.set(targetUid, { ...previousData, game:{...previousData.game, currentForgeProgress:0}, lastItem:moment.utc() });
            }
            const {result, grid} = addItemToGrid(gridItems, spawnLevel);
            const itemMPS = getItemMoneyPerSecond(spawnLevel);
            if(result === true){
                const updatedMoneyPerSecond = calcAddItemMPS(moneyPerSecond, moneyPerSecondDelta, itemMPS);
                SESSIONS.set(targetUid, { ...previousData, game:{ ...previousData.game, gridItems: grid, playerData:{ ...previousData.game.playerData, moneyPerSecond:updatedMoneyPerSecond } } });
                return {result:true, grid};
            }
            return {result:false, grid:gridItems};
        }else{
            throw new Error('No space for items! Stop cheating!');
        }
    }catch(err){
        console.error('Add item by session id error: ', err.message);
        return { result:false, grid:null };
    }
}

const moveItemForSessionId = async (sessionID, request) => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionID);
        const { game:{ gridItems, } } = SESSIONS.get(targetUid);
        const { result, grid } = moveItems(gridItems, request);
        if(result === true){
            const previousData = SESSIONS.get(targetUid);
            SESSIONS.set(targetUid, { ...previousData, game:{ ...previousData.game, gridItems:grid } });
            return { result:true, grid };
        }else{
            return { result:false, grid };
        }
    }catch(err){
        console.error('Move item error: ', err.message);
        return { result:false, grid:null };
    }
}

const mergeItemsForSessionId = async (sessionID, request) => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionID);
        const { game:{ gridItems, modifiers:{ moneyPerSecondDelta }, playerData:{moneyPerSecond} } } = SESSIONS.get(targetUid);
        const { result, grid, newItemId, removedItemId } = mergeItems(gridItems, request);
       
        if(result === true){
            const previousData = SESSIONS.get(targetUid);
            const addItemMPS = getItemMoneyPerSecond(newItemId);
            const removeItemMPS = getItemMoneyPerSecond(removedItemId);
            const correctMPS = calcMergeMPS(moneyPerSecond, moneyPerSecondDelta, addItemMPS, removeItemMPS);
            console.log('Got MPS from merge mps as: ', correctMPS);
            SESSIONS.set(targetUid, { ...previousData, game:{ ...previousData.game, gridItems:grid, playerData:{ ...previousData.game.playerData, moneyPerSecond:correctMPS } } });
            return { result:true, grid };
        }else{
            return { result:false, grid };
        }
    }catch(err){
        console.error('Merge items error: ', err.message);
        return { result:false, grid:null };
    }
}

const addSession = data => {
    try{
        const { uid } = data;
        const userHasSession = findSessionById(uid);
        if(!userHasSession){
            SESSIONS.set(uid, { ...data, lastUpdate:moment.utc(), lastItem:null });
            const { sessionID } = data;
            SESSION_ID_MAP.set(sessionID, uid);
            return true;
        }else{
            throw new Error('Cannot add session. A session already exists for that user');
        }
    }catch(err){
        console.error('Add session error: ', err.message);
        return false;
    }
    
}

//WHAT DOES THIS DO??
const clearSessionById = uid => {
    try{
        return SESSIONS.delete(uid);
    }catch(err){
        console.error('Clear session by id error: ', err.message);
    }
}

const removeSessionBySessionId = async sessionId => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionId);
        await saveSessionBySessionId(sessionId);
        SESSIONS.delete(targetUid);
        SESSION_ID_MAP.delete(sessionId);
        return true;
    }catch(err){
        console.error('Could not delete user session by id: ', err.message);
        return false;
    }
}

const getMoneyBySessionId = sessionID => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionID);
        updateMoneyBySessionId(sessionID);
        const sessionData = SESSIONS.get(targetUid);
        const { game:{ playerData } } = sessionData;
        return { ...playerData };
    }catch(err){
        console.error('Get money by session error: ', err.message);
    }
}

const saveSessionBySessionId = async sessionID => {
    try{
        const targetUid = SESSION_ID_MAP.get(sessionID);
        const sessionData = SESSIONS.get(targetUid);
        const lastLogin = moment.utc().valueOf();
        const result = await User.updateOne({ uid:targetUid },  { ...sessionData, lastLogin });
        console.log('Saved session: ', result);
        console.log('Saving money as: ', sessionData.game.playerData.money);
    }catch(err){
        console.error('Save session error: ', err.message);
    }
}

const generateSessionIdAndToken = (data = {}) => {
    try{
        const { uid } = data;
        const userHasSession = findSessionById(uid);
        if(!userHasSession){
            const sessionID = uuid();
            const token = jwt.sign(sessionID, PRIVATE_KEY);
            const sessionWasAdded = addSession({ ...data, token, sessionID });
            if(sessionWasAdded){
                return {sessionID, token};
            }else{
                return null;
            }
        }else{
            throw new Error(`User with id ${ uid } already has a session!`);
        }
    }
    catch(err){
        console.error('Session generation error: ', err.message);
        return null;
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
    getMoneyBySessionId,
}