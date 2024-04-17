const https = require('https');
const fs = require('fs');
const express = require('express');
const app =express();

const options = {
  key: fs.readFileSync('/var/www/html/vicky/videochatnode/privkey.pem'),
  cert: fs.readFileSync('/var/www/html/vicky/videochatnode/fullchain.pem')
};

// Create HTTPS server
const server = https.createServer(options, app);
const socket = require('socket.io');
server.listen(3000,()=>{
console.log('Server is Running');
});

const bodyParser= require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


app.set('view engine','ejs');
app.set('views','./views');

app.use(express.static('public'));

const userRoute=require('./routes/userRoutes');
app.use('/',userRoute);




//socket io working with signaling server
var io =socket(server);
io.on("connection",function(socket){
    console.log("User Connected :  "+socket.id);
    socket.on("join",function(roomName){
        var rooms = io.sockets.adapter.rooms;
       
        var room=rooms.get(roomName);

        if(room==undefined)
        {
            socket.join(roomName);
            socket.emit("created");
            console.log("Room Created");
        }else if(room.size>0)
        {
            socket.join(roomName);
            socket.emit("joined");
            console.log("Room Joined");
        }else{
            socket.emit("full");
            console.log("Room Full");
        }
         console.log(rooms);

    });

    socket.on("ready",function(roomName){
        console.log("Ready");

        socket.broadcast.to(roomName).emit('ready');

    });

    socket.on("candidate",function(candidate,roomName){
        console.log("candidate");
        console.log(candidate);

        socket.broadcast.to(roomName).emit('candidate',candidate);

    });
    socket.on("offer",function(offer,roomName){
        console.log("offer");
        console.log(offer);

        socket.broadcast.to(roomName).emit('offer',offer);

    });
    socket.on("answer",function(answer,roomName){
        console.log("answer");

        socket.broadcast.to(roomName).emit('answer',answer);

    });

});