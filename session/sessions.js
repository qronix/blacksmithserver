const moment = require('moment');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const { PRIVATE_KEY } = require('./privateKey');

const SESSIONS = new Map();
const SESSION_ID_MAP = new Map();


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

const updateMoneyBySessionId = sessionID => {
    
}

const addSession = data => {
    //check user id is not in sessions list
    const { uid } = data;
    const userHasSession = findSessionById(uid);
    if(!userHasSession){
        SESSIONS.set(uid, { ...data, lastUpdate:moment.utc() });
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
            const sessionWasAdded = addSession({...data, token, sessionID});
            if(sessionWasAdded){
                return {sessionID, token};
            }else{
                return null;
            }
        }else{
            console.log(`User with id ${uid} already has a session!`);
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
}