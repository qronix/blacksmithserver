const app = require('express')();
const http = require('http').createServer(app);
// const http = require('http');

const io = require('socket.io')(http);
// const io = require('socket.io')(3000);
// const server = http.createServer();
const bodyParser = require('body-parser');
const { admin } = require('./firebase/firebase');
const { db } = require('./db/db');
const { User } = require('./db/user.model');
const { updateProfile }  = require('./utils/updateProfile');
const moment  = require('moment');
const bluebird = require('bluebird');
const redis = require('redis');
const adapter = require('socket.io-redis');

const { 
    installItemDocument,
    installEffectDocument,
    installUpgradeDocument, 
} = require('./db/utils');

bluebird.promisifyAll(redis);

const redisAdapter = adapter({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASS || 'password',
});

io.attach(http);
io.adapter(redisAdapter);



//parse application/x-www-form-urlendcoded
app.use(bodyParser.urlencoded({ extended:false }));

//parse JSON
app.use(bodyParser.json());

app.get('/', (req, res)=>{
    res.send('Blacksmith server!').status(200);
});

app.post('/register', async (req, res)=>{
    const {email, password} = req.body;
    try{
        const response = await admin.auth().createUser({ email, password });
        const { uid } = response;
        if(response.uid){
            try{
                const account = new User({email, uid});
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

app.post('/login', async(req, res)=>{
    const { TOKEN } = req.body;
    try{
        const response = await admin.auth().verifyIdToken(TOKEN);
        if(response.uid){
            const uid = response.uid;
            const userProfile = await User.find({uid});
            console.log('Got profile: ', userProfile);
            //update and get new profile data
            updateProfile(userProfile[0]);
            //generate session token
            //push updated profile and session token to Redis
            //update last login time
            const update = await User.updateOne({uid}, { lastLogin:moment.utc().valueOf() });
            console.log('update response: ', update);
            //send session token
            res.status(200).send('Login successful');
        }
    }catch(err){
        console.log('Login error: ', err.message);
        res.status(400).send('Login failed');
    }
});

app.post('/verifytoken', async(req, res) => {
    const { TOKEN } = req.body;
    try{
        const response = await admin.auth().verifyIdToken(TOKEN);
        if(response.uid){
            const userProfile = await User.find({ uid:response.uid});
            console.log('Got profile: ', userProfile);
            User.updateOne({uid:response.uid},{lastLogin:moment.utc().valueOf()});
            const { uid } = userProfile[0];
            if(uid){
                return res.status(200).send('Valid token.');
            }else{
                return res.status(400).send('Invalid token.');
            }
        }
    }catch(err){
        console.log('ERROR: ', err.message);
        return res.status(400).send('Could not verify token.');
    }
});

io.on('connection', ( socket ) => {
    console.log('We have a connection!');
    //lookup session token in Redis
    //if token is found, send profile data to client
    //if no token, disconnect client
    socket.on('disconnect',function(){ console.log('Connection has closed')});
});


http.listen(3001, () => {
    console.log('Blacksmith server listening on port 3001');
    // installItemDocument();
    // installEffectDocument();
    // installUpgradeDocument();
});

