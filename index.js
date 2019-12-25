const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const admin = require('./firebase/firebase');

app.get('/', (req,res)=>{
    res.send('Blacksmith server!').status(200);
});

app.post('/register',async (req,res)=>{
    const {userData} = req.body;
    try{
        const response = await admin.auth().createUser(userData);
        console.log('Response: ', response);
    }catch(err){
        throw new Error(err.message);
    }
});

io.on('connection', (socket)=>{
    console.log('We have a connection!');
});

http.listen(3001, ()=>{
    console.log('Blacksmith server listening on port 3001');
});

