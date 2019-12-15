const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req,res)=>{
    res.send('Blacksmith server!').status(200);
});

io.on('connection', (socket)=>{
    console.log('We have a connection!');
});

http.listen(3001, ()=>{
    console.log('Blacksmith server listening on port 3001');
});

