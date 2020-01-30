const NETWORK_SESSIONS = new Map();
const SESSION_SOCKET_MAP = new Map();
const { findSessionBySessionId, 
    removeSessionBySessionId,
    getSessionDataBySessionId,
} = require('../session/sessions');


const doesNetworkSessionExist = sessionID => {
    return NETWORK_SESSIONS.has(sessionID);
}

const addNetworkSession = data => {
    const { sessionID, token, socketID } = data;
    const sessionExists = doesNetworkSessionExist(sessionID);
    if(!sessionExists){
        const isValidSessionId = findSessionBySessionId(sessionID);
        console.log('isValidSessionId: ' , isValidSessionId);
        if(isValidSessionId){
            console.log('Adding network session');
            NETWORK_SESSIONS.set(sessionID, token);
            SESSION_SOCKET_MAP.set(socketID, sessionID);
            return true;
        }else{
            return false;
        }
    }else{
        console.log('Network session already exists!');
        return false;
    }
}

const removeSession = socketID => {
    try{
        const targetSessionId = SESSION_SOCKET_MAP.get(socketID);
        if(targetSessionId){
            NETWORK_SESSIONS.delete(targetSessionId);
            removeSessionBySessionId(targetSessionId);
            return true;
        }else{
            //session does not exist
            return false;
        }
    }catch(err){
        console.log('Could not remove network or client session: ', err.message);
    }
}

const getGameDataBySocketId = socketID => {
    console.log('Got socket id ggg: ', socketID);
    try{
        const sessionID = SESSION_SOCKET_MAP.get(socketID);
        const data = getSessionDataBySessionId(sessionID);
        return (data) ? data : null;
    }catch(err){
        console.log('Could not get game data: ', err.message);
        return false;
    }
}

const getSessionInfo = () => {

}

module.exports = {
    doesNetworkSessionExist,
    addNetworkSession,
    removeSession,
    getSessionInfo,
    getGameDataBySocketId,

}