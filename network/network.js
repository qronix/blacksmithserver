const NETWORK_SESSIONS = new Map();
const SESSION_SOCKET_MAP = new Map();
const CURRENT_SOCKETS = [];

const { 
    findSessionBySessionId, 
    getSessionDataBySessionId,
} = require('../session/sessions');


const doesNetworkSessionExist = sessionID => {
    try{
        return NETWORK_SESSIONS.has(sessionID);
    }catch(err){
        console.error('Does network session exist error: ', err.message);
        return null;
    }
}

const getSessionIdFromSocketId = socketID => {
    try{
        return sessionID  = SESSION_SOCKET_MAP.get(socketID);
    }catch(err){
        console.error('Get session id from socket id error: ', err.message);
        return null;
    }
}

const addNetworkSession = (data, socket) => {
    try{
        const { sessionID, token, socketID } = data;
        const sessionExists = doesNetworkSessionExist(sessionID);
        if(!sessionExists){
            const isValidSessionId = findSessionBySessionId(sessionID);
            if(isValidSessionId){
                NETWORK_SESSIONS.set(sessionID, token);
                SESSION_SOCKET_MAP.set(socketID, sessionID);
                CURRENT_SOCKETS.push({ socketID, sessionID, socket });
                return true;
            }else{
                return false;
            }
        }else{
            throw new Error('Network session already exists!');
        }
    }catch(err){
        console.error('Add network session error: ', err.message);
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
        console.error('Could not remove network or client session: ', err.message);
        return false;
    }
}

const getSocketFromSessionId = sessionID => {
    try{
        let socket;
        CURRENT_SOCKETS.forEach(item => {
            if(item.sessionID === sessionID){
                socket = item.socket;
            }
        });
        return socket;
    }catch(err){
        console.error('Get socket from session id error: ', err.message);
        return null;
    }
}

const endNetworkSessionBySessionId = sessionID => {
    try{
        const socketID = getSocketIdFromSessionId(sessionID);
        NETWORK_SESSIONS.delete(sessionID);
        const socket = getSocketFromSessionId(sessionID);
        socket.disconnect();
        SESSION_SOCKET_MAP.delete(socketID);
        console.log('Session and connection have been terminated');
        return true;
    }catch(err){
        console.error('End network session error: ', err.message);
        return false;
    }
}

const getGameDataBySocketId = socketID => {
    try{
        const sessionID  = SESSION_SOCKET_MAP.get(socketID);
        const data = getSessionDataBySessionId(sessionID);
        return (data) ? data : null;
    }catch(err){
        console.error('Could not get game data: ', err.message);
        return false;
    }
}

const getSocketIdFromSessionId = sessionID => {
    for(let key of SESSION_SOCKET_MAP){
        if(SESSION_SOCKET_MAP.get(key) === sessionID){
            return key;
        }
    }
}

// const getSessionInfo = () => {

// }

const validateIdentity = (socketID, token) => {
    try{
        const sessionID = getSessionIdFromSocketId(socketID);
        const { token:validToken } = NETWORK_SESSIONS.get(sessionID);
        if(token === validToken){
            return true;
        }else{
            return false;
        }
    }catch(err){
        console.error('Identity validation error: ', err.message);
    }
}

module.exports = {
    doesNetworkSessionExist,
    addNetworkSession,
    removeSession,
    getSessionIdFromSocketId,
    getGameDataBySocketId,
    validateIdentity,
    endNetworkSessionBySessionId,
}