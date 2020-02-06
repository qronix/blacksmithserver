const NETWORK_SESSIONS = new Map();
const SESSION_SOCKET_MAP = new Map();
const CURRENT_SOCKETS = [];

const { findSessionBySessionId, 
    getSessionDataBySessionId,
} = require('../session/sessions');


const doesNetworkSessionExist = sessionID => {
    return NETWORK_SESSIONS.has(sessionID);
}

const updateMoney = socketID => {
    const sessionID = getSessionIdFromSocketId(socketID);

}

const getSessionIdFromSocketId = socketID => {
    return sessionID  = SESSION_SOCKET_MAP.get(socketID);
}

const addNetworkSession = (data, socket) => {
    const { sessionID, token, socketID } = data;
    const sessionExists = doesNetworkSessionExist(sessionID);
    if(!sessionExists){
        const isValidSessionId = findSessionBySessionId(sessionID);
        // console.log('isValidSessionId: ' , isValidSessionId);
        if(isValidSessionId){
            // console.log('Adding network session');
            NETWORK_SESSIONS.set(sessionID, token);
            SESSION_SOCKET_MAP.set(socketID, sessionID);
            CURRENT_SOCKETS.push({ socketID, sessionID, socket });
            return true;
        }else{
            return false;
        }
    }else{
        console.log('Network session already exists!');
        return false;
    }
}

//rename to endSessionBySocketId
const removeSession = socketID => {
    try{
        const sessionID  = SESSION_SOCKET_MAP.get(socketID);
        if(sessionID){
            NETWORK_SESSIONS.delete(sessionID);
            let {socket} = SESSION_SOCKET_MAP.get(socketID);
            socket.disconnect();
            SESSION_SOCKET_MAP.delete(socketID);
            return true;
        }else{
            //session does not exist
            return false;
        }
    }catch(err){
        console.log('Could not remove network or client session: ', err.message);
    }
}

const getSocketFromSessionId = sessionID => {
    let socket;
    CURRENT_SOCKETS.forEach(item => {
        if(item.sessionID === sessionID){
            socket =  item.socket;
        }
    });
    return socket;
}

const endNetworkSessionBySessionId = sessionID => {
    try{
        const socketID = getSocketIdFromSessionId(sessionID);
        NETWORK_SESSIONS.delete(sessionID);
        let socket = getSocketFromSessionId(sessionID);
        socket.disconnect();
        SESSION_SOCKET_MAP.delete(socketID);
        console.log('Session and connection have been terminated');
        return true;
    }catch(err){
        console.log('End network session error: ', err.message);
        return false;
    }
}

const getGameDataBySocketId = socketID => {
    try{
        const sessionID  = SESSION_SOCKET_MAP.get(socketID);
        const data = getSessionDataBySessionId(sessionID);
        return (data) ? data : null;
    }catch(err){
        console.log('Could not get game data: ', err.message);
        return false;
    }
}

const getSocketIdFromSessionId = sessionID => {
    for(let key of SESSION_SOCKET_MAP){
        if(SESSION_SOCKET_MAP.get(key)=== sessionID){
            return key;
        }
    }
}

const getSessionInfo = () => {

}

const validateIdentity = (socketID, token) => {
    try{
        const sessionID = getSessionIdFromSocketId(socketID);
        const {token:validToken} = NETWORK_SESSIONS.get(sessionID);
        if(token === validToken){
            return true;
        }else{
            return false;
        }
    }catch(err){
        console.log('Identity validation error: ', err.message);
    }
}

module.exports = {
    doesNetworkSessionExist,
    addNetworkSession,
    removeSession,
    getSessionInfo,
    getGameDataBySocketId,
    validateIdentity,
    endNetworkSessionBySessionId,
}