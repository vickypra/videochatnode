var socket=io();


var videoChatForms=document.getElementById('video-chat-form');
var videoChatRooms=document.getElementById('video-chat-rooms');
var joinBtn=document.getElementById('join');
var roomInput=document.getElementById('roomName');
var userVideo=document.getElementById('user-video');
var peerVideo=document.getElementById('peer-video');

//upgrading
var btnGroup=document.getElementById('btn-group');
var muteBtn=document.getElementById('mute');
var leaveRoomBtn=document.getElementById('leaveRoom');
var hideCameraBtn=document.getElementById('hideCamera');

userVideo.style.transform = 'scaleX(-1)';

var roomName=roomInput.value;

var creator=false;
var muteFlag=false;
var leaveRoom=false;
var hideCameraFlag=false;

var userStream;


var rtcPeerConnection;


var iceServers={
    iceServers:[
        {
            url:"stun:stun.l.google.com:19302"
        },
        {
            url:"stun:stun.services.mozilla.com"
        },
    ] 

};


navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);  
joinBtn.addEventListener("click",function(){
    if(roomInput.value=="")
    {
        alert("Please enter a room name!");
    }else{
        roomName=roomInput.value;
        socket.emit("join",roomName);



              
           
    }

});
muteBtn.addEventListener("click",function(){
   muteFlag = !muteFlag;

   if(muteFlag)
   {
    userStream.getTracks()[0].enabled=false;
    muteBtn.textContent="Unmute";

   }else{
    userStream.getTracks()[0].enabled=true;
    muteBtn.textContent="Mute";
   }
});

hideCameraBtn.addEventListener("click",function(){
    hideCameraFlag = !hideCameraFlag;
 
    if(hideCameraFlag)
    {
     userStream.getTracks()[1].enabled=false;
     hideCameraBtn.textContent="Show Camera";
 
    }else{
     userStream.getTracks()[1].enabled=true;
     hideCameraBtn.textContent="Hide Camera";
    }
 });


 leaveRoomBtn.addEventListener("click",function(){
    
   socket.emit("leave",roomName);

   videoChatForms.style="display:block";
            btnGroup.style="display:none";
            if(userVideo.srcObject)
            {
                userVideo.srcObject.getTracks()[0].stop();
                userVideo.srcObject.getTracks()[1].stop();
            }

            if(peerVideo.srcObject)
            {
                peerVideo.srcObject.getTracks()[0].stop();
            peerVideo.srcObject.getTracks()[1].stop();
            }

            if(rtcPeerConnection)
            {
                rtcPeerConnection.ontrack=null;
                rtcPeerConnection.onicecandidate=null;
                rtcPeerConnection.close();
            }



           

           

 });

 socket.on("leave",function(){
    creator=true;
    if(peerVideo.srcObject)
    {
        peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
    }

    if(rtcPeerConnection)
    {
        rtcPeerConnection.ontrack=null;
        rtcPeerConnection.onicecandidate=null;
        rtcPeerConnection.close();
    }
 });

socket.on("created",function(){
    creator=true;
    console.log("******connection*********");
    console.log(navigator)
    navigator.getUserMedia(
        {
            audio:true,
            video:true
        },
        function(stream){
            userStream=stream;
            videoChatForms.style="display:none";
            btnGroup.style="display:flex";
            userVideo.srcObject=stream;
            userVideo.onloadedmetadata = function(e){
                userVideo.play();

            }
        },
        function(error){
            alert("You can't access Media");
        }
    );

});
socket.on("joined",function(){
    creator=false;
console.log("******connection*********");
    navigator.getUserMedia(
        {
            audio:true,
            video:true
        },
        function(stream){
            userStream=stream;
            videoChatForms.style="display:none";
            btnGroup.style="display:flex";
            userVideo.srcObject=stream;
            userVideo.onloadedmetadata = function(e){
                userVideo.play();

            }
            socket.emit("ready",roomName);
        },
        function(error){
            alert("You can't access Media");
        }
    );

});
socket.on("full",function(){
    alert("Room is Full!");
});



socket.on("ready",function(){
    if(creator){
        rtcPeerConnection=new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream); //audio track
        rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream); //video track
        
        rtcPeerConnection.createOffer(
            function(offer){
                console.log(offer);
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit('offer',offer,roomName);
            },
            function(error){
                console.log(error);
            },

        );
    }

});
socket.on("candidate",function(candidate){
    var iceCandidate=new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);


});
socket.on("offer",function(offer){
    if(!creator){
        rtcPeerConnection=new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream); //audio track
        rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream); //video track
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer(
            function(answer){
                console.log(answer);
                rtcPeerConnection.setLocalDescription(answer);

                socket.emit('answer',answer,roomName);
            },
            function(error){
                console.log(error);
            },

        );
    }

});
socket.on("answer",function(answer){
    rtcPeerConnection.setRemoteDescription(answer);

});

function OnIceCandidateFunction(event){
    if(event.candidate)
    {
        socket.emit("candidate",event.candidate,roomName);
    }

}
function OnTrackFunction(event){
    peerVideo.srcObject=event.streams[0];
    peerVideo.onloadedmetadata = function(e){
        peerVideo.play();

            }

}
