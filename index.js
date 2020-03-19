const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const { admin } = require('./firebase/firebase');
const { db } = require('./db/db');
const { User } = require('./db/user.model');
const { updateProfile }  = require('./utils/updateProfile');
const moment  = require('moment');

const { 
    installItemDocument,
    installEffectDocument,
    installUpgradeDocument, 
} = require('./db/utils');

const {
    doesNetworkSessionExist,
    addNetworkSession,
    removeNetworkSession,
    getSessionInfo,
    getSessionIdFromSocketId,
    getGameDataBySocketId,
    endNetworkSessionBySessionId,
} = require('./network/network');

const {
    generateSessionIdAndToken,
    findSessionById,
    findSessionBySessionId,
    removeSessionBySessionId,
    updateMoneyBySessionId,
    addItemBySessionId,
    mergeItemsForSessionId,
    moveItemForSessionId,
    getMoneyBySessionId,
    purchaseUpgradeBySessionId,
    getSessionDataBySessionId,
} = require('./session/sessions');

const { 
    getItemValues,
    getUpgradeValues,
    getEffectValues,
} = require('./utils/serverUtils');

//parse application/x-www-form-urlendcoded
app.use(bodyParser.urlencoded({ extended:false }));

//parse JSON
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Blacksmith server!').status(200);
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try{
        const response = await admin.auth().createUser({ email, password });
        const { uid } = response;
        if(response.uid){
            try{
                const account = new User({ email, uid });
                const status = await account.save();
                if(status){
                    return res.status(200).send('User created.');
                }
            }catch(err){
                return res.status(500).send('Could not create user.');
            }
        }
    }catch(err){
        if(err.code){
            switch(err.code){
                case 'auth/email-already-exists':
                    return res.status(400).send('Email already in use.');
                case 'auth/invalid-password':
                    return res.status(400).send('Invalid password format.');
                default:
                    return res.status(500).send('An unspecified error occurred.');
            }
        }else{
            return res.status(500).send('An unknown error occurred.');
        }
    }
});

app.post('/login', async(req, res) => {
    const { TOKEN } = req.body;
    try{
        const response = await admin.auth().verifyIdToken(TOKEN);
        if(response.uid){
            //check if logged in
            const uid = response.uid;
            const session = findSessionById(uid);
            if(session){
                console.log('Session already exists for user!');
                return res.status(401).send({ message: 'Already logged in' });
            }
            const userProfile = await User.find({ uid });
            //update and get new profile data
            const profileChanges = await updateProfile(JSON.stringify(userProfile[0]));
            const updatedProfile = { ...userProfile[0].toObject(), ...profileChanges };
            const { sessionID, token } = generateSessionIdAndToken(updatedProfile);
            //update last login time
            const update = await User.updateOne({ uid }, { lastLogin:moment.utc().valueOf() });
            //send session token
            res.status(200).send({message: 'Login Successful', content: { sessionID, token }});
        }
    }catch(err){
        console.error('Login error: ', err.message);
        res.status(400).send('Login failed');
    }
});

app.post('/logout', async (req, res) => {
    try{
        const { sessionID } = req.body;
        await removeSessionBySessionId(sessionID);
        endNetworkSessionBySessionId(sessionID);
        return res.status(200).send('Logged out.');
    }catch(err){
        console.error('Logout error: ', err.message);
    }
});

app.post('/verifytoken', async(req, res) => {
    const { TOKEN } = req.body;
    try{
        const response = await admin.auth().verifyIdToken(TOKEN);
        if(response.uid){
            const userProfile = await User.find({ uid:response.uid });
            User.updateOne({ uid:response.uid },{ lastLogin:moment.utc().valueOf() });
            const { uid } = userProfile[0];
            if(uid){
                return res.status(200).send('Valid token.');
            }else{
                return res.status(400).send('Invalid token.');
            }
        }
    }catch(err){
        console.error('ERROR: ', err.message);
        return res.status(400).send('Could not verify token.');
    }
});

io.on('connection', ( socket ) => {
    console.log('We have a connection!'); 
    console.log('Getting client identification');

    socket.emit('identify');

    socket.on('identity', (data) => {
        const { sessionID, token } = JSON.parse(data);
        const sessionData = { sessionID, token, socketID:socket.id };
        const isValidClientSession = findSessionBySessionId(sessionID);
        if(isValidClientSession){
            const networkSessionExists = doesNetworkSessionExist(sessionID);
            if(networkSessionExists){
                console.log(`A duplicate session for ID: ${ sessionID } was prevented`);
                socket.disconnect(true);
            }else{
                addNetworkSession(sessionData, socket);
                const gameData = JSON.stringify(getGameDataBySocketId(socket.id));
                socket.emit('initialize', gameData);
                socket.emit('Authorized', "Your connection has been authorized");
            }
        }else{
            console.log('Received invalid session ID, disconnecting....');
            socket.disconnect(true);
        }
    });

    // socket.on('updateMoney', msg => {
    //     const money = Number.parseInt(msg);
    //     const sessionID = getSessionIdFromSocketId(socket.id);
    //     const validRequest = updateMoneyBySessionId(sessionID, money);
    //     if(!validRequest){
    //         console.log('Not a valid request!');
    //         socket.emit('PAUSE');
    //     }
    // });

    socket.on('reqMoneyUpdate', msg => {
        const sessionID = getSessionIdFromSocketId(socket.id);
        if(sessionID){
            console.log('SessionID: ', sessionID);
            const moneyData = getMoneyBySessionId(sessionID);
            const socketData = JSON.stringify(moneyData);
            console.log('Sending client money as: ', moneyData);
            socket.emit('clientMoneyUpdate', socketData);
        }else{
            socket.disconnect(true);
        }
    });
    
    socket.on('addItem', msg => {
        const sessionID = getSessionIdFromSocketId(socket.id);
        if(sessionID){
            const { result, grid } = addItemBySessionId(sessionID);
            if(result === false){
                removeSessionBySessionId(sessionID);
                removeNetworkSession(socket.id);
            }else{
                socket.emit('gridUpdate', JSON.stringify(grid));
                const moneyData = getMoneyBySessionId(sessionID);
                socket.emit('clientMoneyUpdate', JSON.stringify(moneyData));
            }
        }else{
            socket.disconnect();
        }
    });

    socket.on('moveItem', async msg => {
        const sessionID = getSessionIdFromSocketId(socket.id);
        if(sessionID){
            const { result, grid } = await moveItemForSessionId(sessionID, JSON.parse(msg));
            if(result === false){
                removeSessionBySessionId(sessionID);
                removeNetworkSession(socket.id);
            }else{
                socket.emit('gridUpdate', JSON.stringify(grid));
            }
        }else{
            socket.disconnect();
        }
    });

    socket.on('mergeItems', async msg => {
        const sessionID = getSessionIdFromSocketId(socket.id);
        if(sessionID){
            const { result, grid } = await mergeItemsForSessionId(sessionID, JSON.parse(msg));
            if(result === false){
                removeSessionBySessionId(sessionID);
                removeNetworkSession(socket.id);
            }else{
                console.log('Sending grid as: ', grid);
                socket.emit('gridUpdate', JSON.stringify(grid));
                const moneyData = getMoneyBySessionId(sessionID);
                const socketData = JSON.stringify(moneyData);
                socket.emit('clientMoneyUpdate', socketData);
            }
        }else{
            socket.disconnect();
        }
    });

    socket.on('buyUpgrade', msg => {
        // socket.emit('clientUpgrades', `You want to buy upgrade: ${msg}`);
        const sessionID = getSessionIdFromSocketId(socket.id);
        let { upgradeID } = JSON.parse(msg);
        upgradeID = Number.parseInt(upgradeID);
        const { status, statusMsg, } = purchaseUpgradeBySessionId(sessionID, upgradeID);
        // console.log('Session data: ', getSessionDataBySessionId(sessionID));
        const {
            modifiers, 
            upgrades 
        } = getSessionDataBySessionId(sessionID);
        
        // socket.emit('clientUpgrades', upgrades);
        // socket.emit('clientModifiers', modifiers);

        const moneyData = getMoneyBySessionId(sessionID);
        socket.emit('clientMoneyUpdate', JSON.stringify(moneyData));

        //clean this up
        if(status === false){
            socket.emit('clientMsg', statusMsg);
        }else{
            socket.emit('clientMsg', statusMsg);
            socket.emit('clientUpgrades', JSON.stringify(upgrades));
            socket.emit('clientModifiers', JSON.stringify(modifiers));
        }
    });

    socket.on('disconnect', () => {
        //is try/catch necessary here?
        try{
            console.log('Client disconnected, removing session....');
            //clarify this is a NETWORK session being removed
            const clearSessionResult = removeNetworkSession(socket.id);
            (clearSessionResult) ? console.log('Session removed') : console.log('Session not found');
        }catch(err){
            console.error('Could not remove session by socket id: ', socket.id);
        }
    });
});


http.listen(3001, async () => {
    const serverInstall = false;
    try{
        if(serverInstall == true){
            try{
                let result = '';
                console.log('Installing items model.....');
                result = await installItemDocument();
                console.log(result);
                console.log('Installing upgrades model.....');
                result = await installUpgradeDocument();
                console.log(result);
                console.log('Installing effects model.....');
                result = await installEffectDocument();
                console.log(result);
            }catch(err){
                console.error('An error occured during server installation: ', err.message);
            }
        }
        console.log('Getting item values.....');
        await getItemValues();
        console.log('Getting upgrade values.....');
        await getUpgradeValues();
        console.log('Getting effect values.....');
        await getEffectValues();
        
    }catch(err){
        console.error('Get item values error: ', err.message);
    }
    console.log('Blacksmith server listening on port 3001');
    // try{
    //     console.log('Installing items model');
    //     installItemDocument();
    // }catch(err){
    //     console.log('Item install error: ', err.message);
    // }
    // installEffectDocument();
    // installUpgradeDocument();
});

