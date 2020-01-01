const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const { admin } = require('./firebase/firebase');
const { db } = require('./db/db');
const { user } = require('./db/user.model');

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
                const account = new user({email, uid});
                const status = await account.save();
                if(status){
                    res.status(200).send('User created');
                }
            }catch(err){
                res.status(500).send('Could not create user');
            }
        }
    }catch(err){
        if(err.code){
            switch(err.code){
                case 'auth/email-already-exists':
                    res.status(400).send('Email already in use');
                    break;
                case 'auth/invalid-password':
                    res.status(400).send('Invalid password format');
                    break;
                default:
                    res.status(500).send('An unspecified error occurred');
                    break;
            }
        }else{
            res.status(500).send('An unknown error occurred');
        }
    }
});

// app.post('/loginWithCreds', async(req, res) => {
//     admin.auth()
// });

io.on('connection', ( socket ) => {
    console.log('We have a connection!');
});

http.listen(3001, () => {
    console.log('Blacksmith server listening on port 3001');
});

