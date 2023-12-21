const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const cors = require("cors");

const config = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors());

let userconnection = [];
io.on("connection", (socket) => {
  socket.on("userconnect", (data) => {
    console.log(data);
    userconnection.push({
      connectionId: socket.id,
      userId: data,
    });
  });

  var usercount = userconnection.length;
  console.log(usercount);

  socket.on("offersentToRemote", (data) => {
    var whowillReceiveOffer = userconnection.find(
      (user) => user.userId === data.remoteuser
    );
    if (whowillReceiveOffer) {
      socket.to(whowillReceiveOffer.connectionId).emit("receiveoffer", data);
    }
  });  
  
  socket.on("answersentToUser1", (data) => {
    var answerReceiver = userconnection.find((user) => user.userId === data.receiver);
    if (answerReceiver) {
      socket.to(answerReceiver.connectionId).emit("receiveanswer", data);
    }
  });


  socket.on("candidatesenttouser", (data) => {
    var candidateReceiver = userconnection.find((user) => user.userId === data.remoteuser);
    if (candidateReceiver) {
      socket.to(candidateReceiver.connectionId).emit("candidateReceiver", data);
    }
  });

  socket.on('disconnect',()=>{
    console.log("user disconnected");
    var disconnecteduser=userconnection.find((p)=>p.connectionId===socket.id);
    if(disconnecteduser){
        userconnection=userconnection.filter((p)=>p.connectionId!==socket.id);
        console.log("Rest usernames are: ",userconnection.map((user)=>{
                return user.userId;
        }))
    }

  });
  

});

server.listen(5000, () => {
  console.log("listening on port  ", 5000);
});
