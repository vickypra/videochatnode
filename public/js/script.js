var socket=io();


var videoChatForms=document.getElementById('video-chat-form');
var videoChatRooms=document.getElementById('video-chat-rooms');
var joinBtn=document.getElementById('join');
var roomInput=document.getElementById('roomName');
var userVideo=document.getElementById('user-video');
var peerVideo=document.getElementById('peer-video');

userVideo.style.transform = 'scaleX(-1)';

var roomName=roomInput.value;

var creator=false;

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

        socket.emit("join",roomName);



              
           
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
