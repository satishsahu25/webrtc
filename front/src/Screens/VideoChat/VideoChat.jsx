import React, { useState } from "react";
import "./vchat.css";
import { useSearchParams } from "react-router-dom";
import socketIOClient from "socket.io-client";
const WS = "http://localhost:5000";
let localstream;
let remotestream;
let username;
let remoteuser;
let sendchannel;
let receivechannel;
let peerconnnection;

const VideoChat = () => {

  const [msgdata, setmsgdata] = useState();
  const [textmsg, settextmsg] = useState();
  const [params] = useSearchParams();
  username = params.get("username");
  remoteuser = params.get("remoteuser");
  const socket = socketIOClient(WS);

  let init = async () => {
    localstream = await navigator.mediaDevices.getUserMedia({
      video: true,
      autdio: true,
    });
    document.getElementById("user-1").srcObject = localstream;
    createOffer();
  };
  init();

  // let servers = {
  //   iceServers: [
  //     {
  //       urls: [
  //         "stun:stun1.l.google.com:19302",
  //         "stun:stun2.1.google.com:19302",
  //       ],
  //     },
  //   ],
  // };  
  
  let servers = {
    iceServers: [
      { urls: 'stun:coturn.joinmyworld.live:3478' },
      { 
        urls: 'turn:coturn.joinmyworld.live:3478',
        username: 'satish',
        credential: 'satish123'
      } 
    ],
  };


  let createconnection = async () => {
    peerconnnection=new RTCPeerConnection(servers);
    remotestream=new MediaStream();
   document.getElementById("user-2").srcObject=remotestream;

    peerconnnection.onicecandidate = async (event) => {
        //this ice candidate event is fired for both users
        //multiple time to exchange the information
        if (event.candidate) {
            socket.emit("candidatesenttouser", {
                username: username,
                remoteuser: remoteuser,
                icecandidateData: event.candidate,
              });
        }
      };

    //user-1 ka data track par add karna
    localstream.getTracks().forEach((track) => {
      peerconnnection.addTrack(track, localstream);
    });

    //user-2 ka data remotestream par add karna after successful connection
    peerconnnection.addEventListener("track",(e)=>{
      console.log(remotestream);
        remotestream=e.streams[0];
    });
    



    // if no data or connection closed on user-2 side
    remotestream.oninactive = () => {
      remotestream.getTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      //if no activity in remote stream then close the connection
      peerconnnection.close();
    };



    //creating datachannel connection
    sendchannel = peerconnnection.createDataChannel("sendDataChannel");
    sendchannel.onopen = (event) => {
      console.log("send Data channel opened");
      var readystate = sendchannel.readyState;
    //   if(readystate==="open")sendchannel.send("Hi");
      console.log("send data channel state is: ", readystate);
    };

    //it is fired for the receiver channel
    peerconnnection.ondatachannel = (event) => {
      console.log("Receive channel callback is fired");
      receivechannel = event.channel;
      receivechannel.onmessage = (event) => {
        // settextmsg(event.data);
        console.log("Received Message: ",event.data);
      };
      receivechannel.onopen = (event) => {
        const readystate = receivechannel.readystate;
        console.log("receive channel state is: ", readystate);
      };
      receivechannel.onclose = (event) => {
        const readystate = receivechannel.readystate;
        console.log("receive channel state is: ", readystate);
      };
    };


  };

  let createOffer = async () => {
   try{
    createconnection();
    //on creation  of offer multiple times ice candidates are triggered
    let offer = await peerconnnection.createOffer({iceRestart:true});
    await peerconnnection.setLocalDescription(offer);
    socket.emit("offersentToRemote", {
      username: username,
      remoteuser: remoteuser,
      offer: peerconnnection.localDescription, //local SDP description
    });

   }catch(err){
    alert("Failed to create offer:" + err);
   }
  };

  //runned on user-2 side
  let createAnswer =async(data) => {
    createconnection();
    remoteuser = data.username;
      //apne remote desc mein set karliya
    await peerconnnection.setRemoteDescription(data.offer);
    let answer = await peerconnnection.createAnswer();
    await peerconnnection.setLocalDescription(answer);
    //sending answer to user-1
    socket.emit("answersentToUser1", {
      answer: answer,
      sender: data.remoteuser,
      receiver: data.username,
    });
   
  };

  let addAnswer = async (data) => {
    const remotedesc=peerconnnection.currentRemoteDescription;
    if (!remotedesc) {
        peerconnnection.setRemoteDescription(data.answer);
    }
  };

  const senddata = () => {
    // settextmsg(msgdata);
    if (sendchannel.readyState==="open") {
      //if send channel is open for user-1
      sendchannel.send("Hi");
      // sendchannel.send(msgdata);
    } else {
      //if sendchannel is not open that means reacive channel is open
      receivechannel.send(msgdata);
    }
    setmsgdata("");
  };


  socket.emit("userconnect", username);
  socket.on("receiveoffer", (data) => {createAnswer(data); });
  socket.on("receiveanswer", (data) => {addAnswer(data);});
  socket.on("candidateReceiver", (data) => {
   //setting this ice candidate to peer connection
  peerconnnection.addIceCandidate(data.icecandidateData);
  });


  return (
    <>
      <div className="videos">
        <video className="videoplayer" id="user-1" autoPlay playsInline></video>
        <video className="videoplayer" id="user-2" autoPlay playsInline></video>

        <textarea
          cols={25}
          rows={25}
          id="msgInput"
          value={msgdata}
          onChange={(e) => setmsgdata(e.target.value)}
        ></textarea>
        <button className="msgsendBtn" onClick={senddata}>
          Send
        </button>
        <p className="chattextarea">{textmsg}</p>
      </div>
    </>
  );
};

export default VideoChat;
