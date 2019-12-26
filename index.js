const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const { admin } = require('./firebase/firebase');

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
        if(response.uid){
            console.log('User was created');
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

io.on('connection', ( socket ) => {
    console.log('We have a connection!');
});

http.listen(3001, () => {
    console.log('Blacksmith server listening on port 3001');
});

